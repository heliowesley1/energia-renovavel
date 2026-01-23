<?php
// 1. Headers de CORS - Devem ser os primeiros
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Conexão e Erros
require_once 'config.php';
error_reporting(0); // Desativa avisos de texto puro que quebram o JSON

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        $stmt = $conn->query("SELECT * FROM usinas ORDER BY name ASC");
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($result ? $result : []); // Garante JSON válido
    } 
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $conn->prepare("INSERT INTO usinas (name, description) VALUES (?, ?)");
        $stmt->execute([$data->name, $data->description]);
        echo json_encode(["success" => true, "id" => $conn->lastInsertId()]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
exit;