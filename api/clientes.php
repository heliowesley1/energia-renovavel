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
        
        // Se houver ID, faz UPDATE para evitar duplicação
        if (isset($data->id) && !empty($data->id)) {
            $stmt = $conn->prepare("UPDATE clientes SET name=?, email=?, cpf=?, phone=?, status=?, observations=?, sectorId=?, userId=?, imageUrl=? WHERE id=?");
            $stmt->execute([
                $data->name, $data->email, $data->cpf, $data->phone, 
                $data->status, $data->observations, $data->sectorId, 
                $data->userId, $data->imageUrl, $data->id
            ]);
            echo json_encode(["success" => true, "message" => "Cliente atualizado"]);
        } else {
            // Se não houver ID, faz INSERT (Novo Cliente)
            $stmt = $conn->prepare("INSERT INTO clientes (name, email, cpf, phone, status, observations, sectorId, userId, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data->name, $data->email, $data->cpf, $data->phone, 
                $data->status, $data->observations, $data->sectorId, 
                $data->userId, $data->imageUrl
            ]);
            echo json_encode(["id" => $conn->lastInsertId()]);
        }
        break;
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $conn->prepare("UPDATE clientes SET name=?, email=?, cpf=?, phone=?, status=?, observations=?, sectorId=?, userId=? WHERE id=?");
        $stmt->execute([$data->name, $data->email, $data->cpf, $data->phone, $data->status, $data->observations, $data->sectorId, $data->userId, $data->id]);
        echo json_encode(["success" => true]);
        break;
}