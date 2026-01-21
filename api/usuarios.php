<?php
require_once 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $conn->prepare("SELECT id, name, email, role, sectorId, active FROM usuarios");
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $conn->prepare("INSERT INTO usuarios (name, email, password, role, sectorId, active) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data->name, $data->email, password_hash($data->password, PASSWORD_DEFAULT), $data->role, $data->sectorId ?: null, 1]);
        echo json_encode(["id" => $conn->lastInsertId()]);
        break;
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $conn->prepare("UPDATE usuarios SET name=?, email=?, role=?, sectorId=?, active=? WHERE id=?");
        $stmt->execute([$data->name, $data->email, $data->role, $data->sectorId ?: null, $data->active, $data->id]);
        echo json_encode(["success" => true]);
        break;
}