<?php
require_once 'config.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch($method) {
    case 'GET':
        // Listagem de utilizadores com nome do setor
        $sql = "SELECT u.*, s.name as sectorName 
                FROM usuarios u 
                LEFT JOIN setores s ON u.sectorId = s.id 
                ORDER BY u.id DESC";
        $stmt = $conn->query($sql);
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

            if ($action === 'create') {
                // Criar Novo Utilizador
                $stmt = $conn->prepare("INSERT INTO usuarios (name, email, role, sectorId, password, active) VALUES (?, ?, ?, ?, ?, ?)");
                // Nota: Recomenda-se usar password_hash($data->password, PASSWORD_DEFAULT) para segurança
                $success = $stmt->execute([
                    $data->name, 
                    $data->email, 
                    $data->role, 
                    $data->sectorId ?: null, 
                    $data->password, 
                    1 // Ativo por padrão
                ]);
                echo json_encode(["id" => $conn->lastInsertId(), "success" => $success]);

            } elseif ($action === 'update') {
                // Atualizar Utilizador Existente
                $sql = "UPDATE usuarios SET name=?, email=?, role=?, sectorId=?, active=?";
                $params = [$data->name, $data->email, $data->role, $data->sectorId ?: null, $data->active];

                // Só atualiza a password se ela for enviada
                if (!empty($data->password)) {
                    $sql .= ", password=?";
                    $params[] = $data->password;
                }

                $sql .= " WHERE id=?";
                $params[] = $data->id;

                $stmt = $conn->prepare($sql);
                $success = $stmt->execute($params);
                echo json_encode(["success" => $success]);

            } elseif ($action === 'toggleStatus') {
                // Inativar/Ativar Acesso
                $stmt = $conn->prepare("UPDATE usuarios SET active = ? WHERE id = ?");
                $success = $stmt->execute([$data->active, $data->id]);
                echo json_encode(["success" => $success]);
            }

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Erro de base de dados: " . $e->getMessage()]);
        }
        break;
}