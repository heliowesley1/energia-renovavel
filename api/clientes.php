<?php
// 1. Configurações de Cabeçalho (CORS) - Crucial para métodos POST e DELETE
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Resposta imediata para preflight (bloqueia o erro de comunicação do navegador)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($method) {
        case 'GET':
            // Captura os parâmetros enviados pelo Frontend para controle de acesso
            $role = isset($_GET['role']) ? $_GET['role'] : '';
            $sectors = isset($_GET['sectors']) ? $_GET['sectors'] : ''; // Lista de IDs: "1,2,5"
            $userId = isset($_GET['userId']) ? $_GET['userId'] : '';

            if ($role === 'admin' || $role === 'gestao' || $role === 'diretores') {
                // Admins, Gestão e Diretores possuem visão global de todos os clientes
                $sql = "SELECT * FROM clientes ORDER BY id DESC";
                $stmt = $conn->query($sql);
            } 
            elseif ($role === 'supervisor' && !empty($sectors)) {
                // O Supervisor visualiza clientes de todos os setores que monitora
                // Converte a string "1,2" em um array para execução segura com prepared statements
                $sectorArray = explode(',', $sectors);
                $placeholders = implode(',', array_fill(0, count($sectorArray), '?'));
                
                $sql = "SELECT * FROM clientes WHERE sectorId IN ($placeholders) ORDER BY id DESC";
                $stmt = $conn->prepare($sql);
                $stmt->execute($sectorArray);
            } 
            elseif ($role === 'user') {
                // O Consultor (user) visualiza estritamente os seus próprios clientes vinculados
                $sql = "SELECT * FROM clientes WHERE userId = ? ORDER BY id DESC";
                $stmt = $conn->prepare($sql);
                $stmt->execute([$userId]);
            } 
            else {
                // Caso não haja contexto válido de cargo, retorna uma lista vazia por segurança
                echo json_encode([]);
                exit;
            }

            $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($clientes);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            if (!$data) throw new Exception("Dados inválidos");

            // Tratamento para garantir que IDs vazios ou 'all' sejam gravados como NULL no banco
            $sectorId = (!empty($data->sectorId) && $data->sectorId !== 'all') ? $data->sectorId : null;
            $usinaId = (!empty($data->usinaId) && $data->usinaId !== 'all') ? $data->usinaId : null;

            if ($action === 'create') {
                // Criação de novo cliente com todos os campos, incluindo anexos
                $sql = "INSERT INTO clientes (name, email, cpf, phone, sectorId, usinaId, userId, status, observations, createdAt, imageUrl, imageUrl2, imageUrl3) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $success = $stmt->execute([
                    $data->name, $data->email, $data->cpf, $data->phone, $sectorId, $usinaId, 
                    $data->userId, $data->status, $data->observations, $data->createdAt,
                    $data->imageUrl ?? null, $data->imageUrl2 ?? null, $data->imageUrl3 ?? null
                ]);
                echo json_encode(["success" => $success]);
            } 
            elseif ($action === 'update') {
                // Atualização de cliente existente
                $sql = "UPDATE clientes SET 
                            name = ?, email = ?, cpf = ?, phone = ?, sectorId = ?, 
                            usinaId = ?, status = ?, observations = ?, updatedAt = ?, 
                            imageUrl = ?, imageUrl2 = ?, imageUrl3 = ? 
                        WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $success = $stmt->execute([
                    $data->name, $data->email, $data->cpf, $data->phone, $sectorId, $usinaId, 
                    $data->status, $data->observations, $data->updatedAt, 
                    $data->imageUrl ?? null, $data->imageUrl2 ?? null, $data->imageUrl3 ?? null,
                    $data->id
                ]);
                echo json_encode(["success" => $success]);
            }
            break;

        case 'DELETE':
            // Captura o ID da URL (?id=X) ou do corpo da requisição
            $id = isset($_GET['id']) ? $_GET['id'] : null;
            
            if (!$id) {
                $input = json_decode(file_get_contents("php://input"));
                $id = $input->id ?? null;
            }

            if ($id && is_numeric($id)) {
                $stmt = $conn->prepare("DELETE FROM clientes WHERE id = ?");
                $success = $stmt->execute([$id]);
                
                if ($success) {
                    echo json_encode(["success" => true, "message" => "Removido"]);
                } else {
                    http_response_code(400);
                    echo json_encode(["success" => false, "error" => "Falha na execução"]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "ID inválido"]);
            }
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}