<?php
require_once 'config.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch($method) {
    case 'GET':
        $stmt = $conn->query("SELECT * FROM clientes ORDER BY id DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        try {
            $data = json_decode(file_get_contents("php://input"));
            if (!$data) {
                http_response_code(400);
                echo json_encode(["error" => "Dados inválidos"]);
                exit;
            }

            $sectorId = (!empty($data->sectorId) && $data->sectorId !== '0') ? $data->sectorId : null;

            if ($action === 'update' || (isset($data->id) && !empty($data->id))) {
                $stmt = $conn->prepare("UPDATE clientes SET name=?, email=?, cpf=?, phone=?, status=?, observations=?, sectorId=?, userId=?, imageUrl=?, imageUrl2=?, imageUrl3=?, createdAt=?, updatedAt=? WHERE id=?");
                $success = $stmt->execute([
                    $data->name, $data->email, $data->cpf, $data->phone, 
                    $data->status, $data->observations, $sectorId, 
                    $data->userId, $data->imageUrl, $data->imageUrl2, $data->imageUrl3,
                    $data->createdAt, $data->updatedAt, $data->id
                ]);
                echo json_encode(["success" => $success]);
            } else {
                $stmt = $conn->prepare("INSERT INTO clientes (name, email, cpf, phone, status, observations, sectorId, userId, imageUrl, imageUrl2, imageUrl3, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $success = $stmt->execute([
                    $data->name, $data->email, $data->cpf, $data->phone, 
                    $data->status, $data->observations, $sectorId, $data->userId, 
                    $data->imageUrl, $data->imageUrl2, $data->imageUrl3, 
                    $data->createdAt, $data->updatedAt
                ]);
                echo json_encode(["id" => $conn->lastInsertId(), "success" => true]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        try {
            $id = isset($_GET['id']) ? $_GET['id'] : null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(["error" => "ID não fornecido"]);
                exit;
            }
            $stmt = $conn->prepare("DELETE FROM clientes WHERE id = ?");
            $success = $stmt->execute([$id]);
            echo json_encode(["success" => $success]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;
}