<?php
require_once 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $conn->query("SELECT * FROM clientes");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $conn->prepare("INSERT INTO clientes (name, email, cpf, phone, status, observations, sectorId, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data->name, $data->email, $data->cpf, $data->phone, $data->status, $data->observations, $data->sectorId, $data->userId]);
        echo json_encode(["id" => $conn->lastInsertId()]);
        break;
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $conn->prepare("UPDATE clientes SET name=?, email=?, cpf=?, phone=?, status=?, observations=?, sectorId=?, userId=? WHERE id=?");
        $stmt->execute([$data->name, $data->email, $data->cpf, $data->phone, $data->status, $data->observations, $data->sectorId, $data->userId, $data->id]);
        echo json_encode(["success" => true]);
        break;
}