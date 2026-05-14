<?php

require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Metode no permes.']);
    exit;
}

$body     = json_decode(file_get_contents('php://input'), true);
$email    = trim($body['email']    ?? '');
$password = trim($body['password'] ?? '');

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email i contrasenya requerits.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => "Format d'email no valid."]);
    exit;
}

$pdo  = getDB();
$stmt = $pdo->prepare(
    'SELECT id, nom, contrasenya, subscrit
     FROM Usuari
     WHERE email = ?
     LIMIT 1'
);
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Credencials incorrectes.']);
    exit;
}

$contrasenyaDB = $user['contrasenya'];

if (password_get_info($contrasenyaDB)['algo'] !== null) {
    $valid = password_verify($password, $contrasenyaDB);
} else {
    $valid = ($password === $contrasenyaDB);
    if ($valid) {
        $newHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $pdo->prepare('UPDATE Usuari SET contrasenya = ? WHERE id = ?')
            ->execute([$newHash, $user['id']]);
    }
}

if (!$valid) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Credencials incorrectes.']);
    exit;
}

session_start();
session_regenerate_id(true);

$_SESSION['user_id']  = $user['id'];
$_SESSION['user_nom'] = $user['nom'];
$_SESSION['subscrit'] = (bool) $user['subscrit'];

echo json_encode([
    'success'  => true,
    'nom'      => $user['nom'],
    'subscrit' => (bool) $user['subscrit'],
]);
