<?php
require_once 'config.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch($method) {
    case 'GET':
        // Listagem de utilizadores com nome do setor
        $sql = "SELECT u.*, s.name as sectorName 
                FROM usuarios u 
                LEFT JOIN setores s ON u.sectorId = s.id 
                ORDER BY u.id DESC";
        $stmt = $conn->query($sql);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
    try {
        $data = json_decode(file_get_contents("php://input"));
        if (!$data) exit;

        if ($action === 'create') {
            $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("INSERT INTO usuarios (name, email, role, sectorId, password, active) VALUES (?, ?, ?, ?, ?, ?)");
            $success = $stmt->execute([
                $data->name, 
                $data->email, 
                $data->role, 
                $data->sectorId ?: null, 
                $hashedPassword, 
                1 
            ]);
            echo json_encode(["success" => $success]);

        } elseif ($action === 'update') {
            $sql = "UPDATE usuarios SET name=?, email=?, role=?, sectorId=?, active=?";
            $params = [$data->name, $data->email, $data->role, $data->sectorId ?: null, $data->active];

            if (!empty($data->password)) {
                $sql .= ", password=?";
                $params[] = password_hash($data->password, PASSWORD_DEFAULT);
            }

            $sql .= " WHERE id=?";
            $params[] = $data->id;

            $stmt = $conn->prepare($sql);
            $success = $stmt->execute($params);
            echo json_encode(["success" => $success]);
        }
        // ... toggleStatus ...
    } catch (PDOException $e) { /* erro */ }
    break;
}