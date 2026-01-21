<?php
require_once 'config.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch($method) {
    case 'GET':
        // Ordenação decrescente: o que foi cadastrado por último aparece primeiro
        $stmt = $conn->query("SELECT * FROM clientes ORDER BY id DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        // Verifica se é atualização para evitar duplicidade
        if ($action === 'update' || (isset($data->id) && !empty($data->id))) {
            $stmt = $conn->prepare("UPDATE clientes SET name=?, email=?, cpf=?, phone=?, status=?, observations=?, sectorId=?, userId=?, imageUrl=?, updatedAt=? WHERE id=?");
            $stmt->execute([
                $data->name, $data->email, $data->cpf, $data->phone, 
                $data->status, $data->observations, $data->sectorId, 
                $data->userId, $data->imageUrl, $data->updatedAt, $data->id
            ]);
            echo json_encode(["success" => true]);
        } else {
            // Cadastro de novo cliente
            $stmt = $conn->prepare("INSERT INTO clientes (name, email, cpf, phone, status, observations, sectorId, userId, imageUrl, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data->name, $data->email, $data->cpf, $data->phone, 
                $data->status, $data->observations, $data->sectorId, 
                $data->userId, $data->imageUrl, $data->createdAt, $data->updatedAt
            ]);
            echo json_encode(["id" => $conn->lastInsertId()]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $conn->prepare("UPDATE clientes SET name=?, email=?, cpf=?, phone=?, status=?, observations=?, sectorId=?, userId=?, imageUrl=?, updatedAt=? WHERE id=?");
        $stmt->execute([$data->name, $data->email, $data->cpf, $data->phone, $data->status, $data->observations, $data->sectorId, $data->userId, $data->imageUrl, $data->updatedAt, $data->id]);
        echo json_encode(["success" => true]);
        break;
}