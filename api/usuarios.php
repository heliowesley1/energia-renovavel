<?php
require_once 'config.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Para o método PUT, precisamos capturar o corpo da requisição manualmente
if ($method === 'PUT' || $method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
}

switch($method) {
    case 'GET':
        $stmt = $conn->prepare("SELECT id, name, email, role, sectorId, active FROM usuarios");
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        if ($action === 'update') {
            $stmt = $conn->prepare("UPDATE usuarios SET name=?, email=?, role=?, sectorId=?, active=? WHERE id=?");
            $stmt->execute([$data->name, $data->email, $data->role, $data->sectorId ?: null, $data->active, $data->id]);
            echo json_encode(["success" => true]);
        } else if ($action === 'delete') {
            $stmt = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
            $stmt->execute([$data->id]);
            echo json_encode(["success" => true]);
        } else if ($action === 'toggleStatus') {
            $stmt = $conn->prepare("UPDATE usuarios SET active = ? WHERE id = ?");
            $stmt->execute([$data->active, $data->id]);
            echo json_encode(["success" => true]);
        } else {
            // CREATE
            $stmt = $conn->prepare("INSERT INTO usuarios (name, email, password, role, sectorId, active) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$data->name, $data->email, password_hash($data->password, PASSWORD_DEFAULT), $data->role, $data->sectorId ?: null, 1]);
            echo json_encode(["id" => $conn->lastInsertId()]);
        }
        break;

    case 'PUT':
        // Suporte direto ao método PUT
        $stmt = $conn->prepare("UPDATE usuarios SET name=?, email=?, role=?, sectorId=?, active=? WHERE id=?");
        $stmt->execute([$data->name, $data->email, $data->role, $data->sectorId ?: null, $data->active, $data->id]);
        echo json_encode(["success" => true]);
        break;
}