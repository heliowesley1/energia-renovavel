<?php
// api/usuarios.php

// 1. Configurações de Cabeçalho (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Resposta imediata para preflight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';
header("Content-Type: application/json; charset=UTF-8");

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch($method) {
        case 'GET':
            // Listagem de usuários
            $sql = "SELECT u.*, s.name as sectorName 
                    FROM usuarios u 
                    LEFT JOIN setores s ON u.sectorId = s.id 
                    ORDER BY u.id DESC";
            $stmt = $conn->query($sql);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Converte o campo 'active' para booleano real para evitar problemas no frontend
            foreach ($results as &$row) {
                $row['active'] = (bool)$row['active'];
            }
            
            echo json_encode($results);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            
            if (!$data) {
                echo json_encode(["success" => false, "error" => "Dados inválidos"]);
                exit;
            }

            if ($action === 'create') {
                $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);
                $stmt = $conn->prepare("INSERT INTO usuarios (name, email, role, sectorId, password, active) VALUES (?, ?, ?, ?, ?, ?)");
                $success = $stmt->execute([
                    $data->name, 
                    $data->email, 
                    $data->role, 
                    $data->sectorId ?: null, 
                    $hashedPassword, 
                    1 
                ]);
                echo json_encode(["success" => $success]);

            } elseif ($action === 'update') {
                $sql = "UPDATE usuarios SET name=?, email=?, role=?, sectorId=?, active=?";
                $params = [$data->name, $data->email, $data->role, $data->sectorId ?: null, $data->active ? 1 : 0];

                if (!empty($data->password)) {
                    $sql .= ", password=?";
                    $params[] = password_hash($data->password, PASSWORD_DEFAULT);
                }

                $sql .= " WHERE id=?";
                $params[] = $data->id;

                $stmt = $conn->prepare($sql);
                $success = $stmt->execute($params);
                echo json_encode(["success" => $success]);

            } elseif ($action === 'toggleStatus') {
                // CORREÇÃO: Adicionada a lógica que faltava
                $stmt = $conn->prepare("UPDATE usuarios SET active = ? WHERE id = ?");
                // Garante que salve 1 ou 0 no banco
                $status = (!empty($data->active) && $data->active !== 'false') ? 1 : 0;
                $success = $stmt->execute([$status, $data->id]);
                echo json_encode(["success" => $success]);
            } else {
                // Caso não caia em nenhuma ação
                echo json_encode(["success" => false, "error" => "Ação desconhecida"]);
            }
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erro no servidor: " . $e->getMessage()]);
}
?>