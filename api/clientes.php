<?php
// api/clientes.php
// OTIMIZAÇÃO: Suporte a filtro de data e seleção de colunas leves

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

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
            // Se for busca por ID específico, retorna TUDO (incluindo imagens)
            if (isset($_GET['id'])) {
                $stmt = $conn->prepare("SELECT * FROM clientes WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                echo json_encode($stmt->fetch(PDO::FETCH_ASSOC) ?: null);
                exit;
            }

            // OTIMIZAÇÃO 1: Seleciona apenas colunas de texto (sem imagens pesadas) para listagens
            $columns = "id, name, email, cpf, phone, sectorId, usinaId, userId, status, observations, createdAt, updatedAt";
            
            $role = $_GET['role'] ?? '';
            $sectors = $_GET['sectors'] ?? '';
            $userId = $_GET['userId'] ?? '';
            
            // OTIMIZAÇÃO 2: Filtro de Data no Servidor
            $startDate = $_GET['start_date'] ?? null;
            $endDate = $_GET['end_date'] ?? null;
            $dateQuery = "";
            $dateParams = [];

            if ($startDate && $endDate) {
                $dateQuery = " AND createdAt BETWEEN ? AND ?";
                $endDate = $endDate . " 23:59:59";
                $dateParams = [$startDate, $endDate];
            }

            // Construção da Query Baseada no Perfil
            if ($role === 'admin' || $role === 'gestao' || $role === 'diretores') {
                $sql = "SELECT $columns FROM clientes WHERE 1=1 $dateQuery ORDER BY id DESC";
                $stmt = $conn->prepare($sql);
                $stmt->execute($dateParams);
            } 
            elseif ($role === 'supervisor' && !empty($sectors)) {
                $sectorArray = explode(',', $sectors);
                // Mescla os params de data com os de setor
                $placeholders = implode(',', array_fill(0, count($sectorArray), '?'));
                $sql = "SELECT $columns FROM clientes WHERE sectorId IN ($placeholders) $dateQuery ORDER BY id DESC";
                $stmt = $conn->prepare($sql);
                $stmt->execute(array_merge($sectorArray, $dateParams));
            } 
            elseif ($role === 'user') {
                $sql = "SELECT $columns FROM clientes WHERE userId = ? $dateQuery ORDER BY id DESC";
                $stmt = $conn->prepare($sql);
                $stmt->execute(array_merge([$userId], $dateParams));
            } 
            else {
                echo json_encode([]);
                exit;
            }

            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            if (!$data) throw new Exception("Dados inválidos");

            $sectorId = (!empty($data->sectorId) && $data->sectorId !== 'all') ? $data->sectorId : null;
            $usinaId = (!empty($data->usinaId) && $data->usinaId !== 'all') ? $data->usinaId : null;

            if ($action === 'create') {
                $sql = "INSERT INTO clientes (name, email, cpf, phone, sectorId, usinaId, userId, status, observations, createdAt, imageUrl, imageUrl2, imageUrl3) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    $data->name, $data->email, $data->cpf, $data->phone, $sectorId, $usinaId, 
                    $data->userId, $data->status, $data->observations, $data->createdAt,
                    $data->imageUrl ?? null, $data->imageUrl2 ?? null, $data->imageUrl3 ?? null
                ]);
                echo json_encode(["success" => true]);
            } 
            elseif ($action === 'update') {
                $sql = "UPDATE clientes SET 
                            name = ?, email = ?, cpf = ?, phone = ?, sectorId = ?, 
                            usinaId = ?, status = ?, observations = ?, updatedAt = ?, 
                            imageUrl = ?, imageUrl2 = ?, imageUrl3 = ? 
                        WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    $data->name, $data->email, $data->cpf, $data->phone, $sectorId, $usinaId, 
                    $data->status, $data->observations, $data->updatedAt, 
                    $data->imageUrl ?? null, $data->imageUrl2 ?? null, $data->imageUrl3 ?? null,
                    $data->id
                ]);
                echo json_encode(["success" => true]);
            }
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if ($id) {
                $stmt = $conn->prepare("DELETE FROM clientes WHERE id = ?");
                echo json_encode(["success" => $stmt->execute([$id])]);
            } else {
                http_response_code(400);
                echo json_encode(["error" => "ID ausente"]);
            }
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>