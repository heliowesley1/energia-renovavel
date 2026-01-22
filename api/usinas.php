<?php
// Configurações de CORS - DEVE vir antes de qualquer saída de texto ou include
header("Access-Control-Allow-Origin: http://localhost:5173"); // Permite seu ambiente local
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Trata requisições de pré-verificação (Preflight) do navegador
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';


switch($method) {
    case 'GET':
        $stmt = $conn->query("SELECT * FROM usinas ORDER BY name ASC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        if ($action === 'create') {
            $stmt = $conn->prepare("INSERT INTO usinas (name, description) VALUES (?, ?)");
            $stmt->execute([$data->name, $data->description]);
            echo json_encode(["success" => true, "id" => $conn->lastInsertId()]);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'];
        $stmt = $conn->prepare("DELETE FROM usinas WHERE id = ?");
        $success = $stmt->execute([$id]);
        echo json_encode(["success" => $success]);
        break;
}