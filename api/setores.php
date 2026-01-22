<?php
require_once 'config.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch($method) {
    case 'GET':
        $stmt = $conn->query("SELECT * FROM setores");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        if ($action === 'update' && isset($data->id)) {
            // Lógica de Atualização (Evita duplicação)
            $stmt = $conn->prepare("UPDATE setores SET name=?, description=? WHERE id=?");
            $stmt->execute([$data->name, $data->description, $data->id]);
            echo json_encode(["success" => true]);
        } else if ($action === 'delete') {
            // Fallback para delete via POST
            $stmt = $conn->prepare("DELETE FROM setores WHERE id = ?");
            $stmt->execute([$data->id]);
            echo json_encode(["success" => true]);
        } else {
            // Lógica de Criação
            $stmt = $conn->prepare("INSERT INTO setores (name, description) VALUES (?, ?)");
            $stmt->execute([$data->name, $data->description]);
            echo json_encode(["id" => $conn->lastInsertId()]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $conn->prepare("UPDATE setores SET name=?, description=? WHERE id=?");
        $stmt->execute([$data->name, $data->description, $data->id]);
        echo json_encode(["success" => true]);
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if ($id) {
            $stmt = $conn->prepare("DELETE FROM setores WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["success" => true]);
        }
        break;
}