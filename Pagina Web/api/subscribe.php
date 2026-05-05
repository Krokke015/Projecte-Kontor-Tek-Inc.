<?php
/* subscribe.php - Kontor Tek Inc.
   Col.loca aquest fitxer a: /api/subscribe.php
   Rep (POST JSON): { "pla": "mensual" | "anual" }
   Ret: { "success": true } | { "success": false, "error": "..." }
*/

require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Metode no permes.']);
    exit;
}

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'No autenticat.']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$pla  = strtolower(trim($body['pla'] ?? ''));

$plans_valids = ['mensual', 'anual'];
if (!in_array($pla, $plans_valids, true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Pla no valid.']);
    exit;
}

$user_id = (int) $_SESSION['user_id'];
$pdo     = getDB();

/* Comprovar si ja te subscripcio activa */
$check = $pdo->prepare(
    'SELECT id_subscripcio FROM Subscripcio
     WHERE id_usuari = ? AND estat_subscripcio = \'activa\' AND data_fi >= CURDATE()
     LIMIT 1'
);
$check->execute([$user_id]);
if ($check->fetch()) {
    echo json_encode(['success' => false, 'error' => 'Ja tens una subscripcio activa.']);
    exit;
}

/* Preus i durada per pla
   🔧 Actualitza els preus quan estiguin definits */
$config = [
    'mensual' => ['preu' => 9.99,  'mesos' => 1],
    'anual'   => ['preu' => 99.99, 'mesos' => 12],
];

$preu    = $config[$pla]['preu'];
$data_fi = date('Y-m-d', strtotime('+' . $config[$pla]['mesos'] . ' months'));

/* Inserir subscripcio */
$ins = $pdo->prepare(
    'INSERT INTO Subscripcio (id_usuari, tipus_pla, data_inici, data_fi, preu, estat_subscripcio)
     VALUES (?, ?, CURDATE(), ?, ?, \'activa\')'
);
$ins->execute([$user_id, $pla, $data_fi, $preu]);

/* Marcar usuari com a subscrit */
$pdo->prepare('UPDATE Usuari SET subscrit = 1 WHERE id = ?')->execute([$user_id]);

/* Actualitzar sessio */
$_SESSION['subscrit'] = true;

echo json_encode(['success' => true]);
