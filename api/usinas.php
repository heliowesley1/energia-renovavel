<?php
// api/usinas.php
require_once 'config.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

// Tratamento para requisições Preflight (OPTIONS)
if ($method == 'OPTIONS') {
    exit;
}

// 1. LISTAGEM (GET)
if ($method == 'GET') {
    $stmt = $conn->query("SELECT * FROM usinas ORDER BY name ASC");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

// 2. EXCLUSÃO (DELETE)
if ($method == 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    
    if ($id) {
        $sql = "DELETE FROM usinas WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $success = $stmt->execute([$id]);
        
        echo json_encode(["success" => $success]);
    } else {
        echo json_encode(["success" => false, "message" => "ID não fornecido"]);
    }
    exit;
}

// 3. CRIAÇÃO E ATUALIZAÇÃO (POST)
if ($method == 'POST') {
    $action = $_GET['action'] ?? '';
    $data = json_decode(file_get_contents("php://input"));

    if ($action == 'create') {
        $sql = "INSERT INTO usinas (name, description, comission) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$data->name, $data->description, $data->comission]);
        echo json_encode(["success" => true]);
    } elseif ($action == 'update') {
        $sql = "UPDATE usinas SET name = ?, description = ?, comission = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$data->name, $data->description, $data->comission, $data->id]);
        echo json_encode(["success" => true]);
    }
    exit;
}
?>