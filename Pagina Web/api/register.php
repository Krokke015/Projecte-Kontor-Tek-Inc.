<?php

require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Mètode no permès.']);
    exit;
}

$body     = json_decode(file_get_contents('php://input'), true);
$nom      = trim($body['nom']      ?? '');
$email    = trim($body['email']    ?? '');
$password = trim($body['password'] ?? '');
$pla      = trim($body['pla']      ?? '');

if (!$nom || !$email || !$password) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Nom, email i contrasenya són obligatoris.']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => "Format d'email no vàlid."]);
    exit;
}
if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'La contrasenya ha de tenir mínim 8 caràcters.']);
    exit;
}

$plans_valids = ['basic', 'pro', 'enterprise', ''];
if (!in_array($pla, $plans_valids, true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Pla no vàlid.']);
    exit;
}

$pdo  = getDB();
$stmt = $pdo->prepare('SELECT id FROM Usuari WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'error' => 'Aquest email ja està registrat.']);
    exit;
}

$stmt2 = $pdo->prepare('SELECT id FROM Usuari WHERE nom = ? LIMIT 1');
$stmt2->execute([$nom]);
if ($stmt2->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'error' => 'Aquest nom d\'usuari ja existeix.']);
    exit;
}

$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

$ins = $pdo->prepare(
    'INSERT INTO Usuari (nom, email, contrasenya, data_registre, subscrit)
     VALUES (?, ?, ?, CURDATE(), 0)'
);
$ins->execute([$nom, $email, $hash]);
$user_id = (int) $pdo->lastInsertId();

$preus = ['basic' => 9.99, 'pro' => 19.99, 'enterprise' => 49.99];

if ($pla !== '') {
    $preu    = $preus[$pla] ?? 0.00;
    $data_fi = date('Y-m-d', strtotime('+1 year')); 

    $sub = $pdo->prepare(
        'INSERT INTO Subscripcio
            (id_usuari, tipus_pla, data_inici, data_fi, preu, estat_subscripcio)
         VALUES (?, ?, CURDATE(), ?, ?, \'activa\')'
    );
    $sub->execute([$user_id, $pla, $data_fi, $preu]);

    $pdo->prepare('UPDATE Usuari SET subscrit = 1 WHERE id = ?')->execute([$user_id]);
}

echo json_encode(['success' => true]);
