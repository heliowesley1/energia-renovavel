<?php
// api/config.php

// 1. Cabeçalhos CORS - Devem vir antes de qualquer outro código
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// 2. Resposta para a requisição "Preflight" do navegador
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 3. Credenciais do Banco de Dados
$host = "localhost";
$db_name = "energia_renovavel"; // Coloque o nome correto aqui
$username = "root";              // Geralmente 'root' no XAMPP
$password = "";

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erro na conexão: " . $e->getMessage()]);
    exit;
}
?>