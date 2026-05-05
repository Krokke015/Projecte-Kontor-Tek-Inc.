<?php

require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['logged' => false]);
    exit;
}

$user_id = (int) $_SESSION['user_id'];

$pdo  = getDB();
$stmt = $pdo->prepare(
    'SELECT tipus_pla
     FROM Subscripcio
     WHERE id_usuari = ?
       AND estat_subscripcio = \'activa\'
       AND data_fi >= CURDATE()
     ORDER BY data_inici DESC
     LIMIT 1'
);
$stmt->execute([$user_id]);
$sub = $stmt->fetch();

if (!$sub) {
    echo json_encode(['logged' => true, 'subscrit' => false]);
    exit;
}

echo json_encode([
    'logged'   => true,
    'subscrit' => true,
    'pla'      => $sub['tipus_pla'],
]);
