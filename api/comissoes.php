<?php
// api/comissoes.php

// 1. CORREÇÃO CRÍTICA DE CORS (Permite que o frontend acesse os dados)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Resposta imediata para preflight (evita bloqueios do navegador)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';
header("Content-Type: application/json; charset=UTF-8");

try {
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;

    $params = [];
    $dateFilter = "";
    
    // Filtro de data
    if (!empty($startDate) && !empty($endDate)) {
        // Garante que a data final pegue até o último segundo do dia
        $endDate = $endDate . " 23:59:59";
        $dateFilter = " AND c.createdAt BETWEEN ? AND ?";
        $params[] = $startDate;
        $params[] = $endDate;
    }

    // SQL OTIMIZADO: Busca contratos formalizados e agrupa por consultor e usina
    $sql = "SELECT 
            u.id as userId,
            u.name as consultor,
            u.role,
            COALESCE(s.name, 'Geral') as setor_nome,
            us.name as usina_nome,
            COALESCE(us.comission, 0) as usina_valor_comissao,
            COUNT(c.id) as qtd_por_usina
        FROM usuarios u
        LEFT JOIN setores s ON u.sectorId = s.id
        INNER JOIN clientes c ON u.id = c.userId
        LEFT JOIN usinas us ON c.usinaId = us.id
        WHERE (LOWER(c.status) = 'formalizado' OR LOWER(c.status) = 'formalized') 
        $dateFilter
        GROUP BY u.id, us.id, us.name, us.comission, s.name, u.name, u.role
        ORDER BY u.name ASC";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $relatorio = [];

    // Formata o JSON para o frontend
    foreach ($rows as $row) {
        $id = $row['userId'];
        
        if (!isset($relatorio[$id])) {
            $relatorio[$id] = [
                "userId" => $id,
                "consultor" => $row['consultor'],
                "role" => $row['role'],
                "setor" => ($row['role'] === 'admin') ? "" : $row['setor_nome'],
                "detalhes_usinas" => [],
                "contratos" => 0,
                "total_comissao" => 0
            ];
        }

        if ($row['usina_nome']) {
            $qtd = (int)$row['qtd_por_usina'];
            $valorUnitario = (float)$row['usina_valor_comissao'];
            $valorTotalUsina = $qtd * $valorUnitario;
            
            $relatorio[$id]["detalhes_usinas"][$row['usina_nome']] = [
                "qtd" => $qtd,
                "valor" => $valorTotalUsina
            ];
            
            $relatorio[$id]["contratos"] += $qtd;
            $relatorio[$id]["total_comissao"] += $valorTotalUsina;
        }
    }

    echo json_encode(array_values($relatorio));

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erro SQL", "details" => $e->getMessage()]);
}
?>