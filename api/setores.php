<?php
require_once 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $conn->query("SELECT * FROM setores");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $conn->prepare("INSERT INTO setores (name, description) VALUES (?, ?)");
        $stmt->execute([$data->name, $data->description]);
        echo json_encode(["id" => $conn->lastInsertId()]);
        break;
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $conn->prepare("UPDATE setores SET name=?, description=? WHERE id=?");
        $stmt->execute([$data->name, $data->description, $data->id]);
        echo json_encode(["success" => true]);
        break;
    case 'DELETE':
        $id = $_GET['id'];
        $stmt = $conn->prepare("DELETE FROM setores WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
        break;
}