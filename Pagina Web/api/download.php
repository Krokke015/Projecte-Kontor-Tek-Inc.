<?php

require_once __DIR__ . '/db.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'No autenticat. Inicia sessió primer.']);
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
     LIMIT 1'
);
$stmt->execute([$user_id]);
$sub = $stmt->fetch();

if (!$sub) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Sense subscripció activa. Selecciona un pla primer.']);
    exit;
}

$file_path = dirname(__DIR__) . '/files/Instalacion_v12.zip';
$file_name = 'Instalacion_v12.zip';

if (!file_exists($file_path) || !is_readable($file_path)) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Fitxer no trobat al servidor.']);
    exit;
}

header('Content-Description: File Transfer');
header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . $file_name . '"');
header('Content-Transfer-Encoding: binary');
header('Expires: 0');
header('Cache-Control: must-revalidate');
header('Pragma: public');
header('Content-Length: ' . filesize($file_path));
ob_clean();
flush();
readfile($file_path);
exit;
