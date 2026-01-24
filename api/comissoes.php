<?php
// api/comissoes.php
require_once 'config.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit; }

try {
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;

    $params = [];
    $dateFilter = "";
    
    // Filtro de data flexível
    if (!empty($startDate) && !empty($endDate)) {
        $dateFilter = " AND DATE(c.createdAt) BETWEEN ? AND ?";
        $params[] = $startDate;
        $params[] = $endDate;
    }

    // SQL OTIMIZADO:
    // 1. Buscamos TODOS os usuários (incluindo Admins).
    // 2. Usamos INNER JOIN com clientes para garantir que só pegamos quem realmente vendeu.
    // 3. LOWER(c.status) garante que 'Formalizado', 'formalizado' ou 'FORMALIZADO' funcionem.
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
        -- Mudamos para garantir que o vínculo com o usuário exista
        INNER JOIN clientes c ON u.id = c.userId
        -- LEFT JOIN na usina para não sumir com o cliente se a usina não estiver marcada
        LEFT JOIN usinas us ON c.usinaId = us.id
        -- Filtro flexível para aceitar ambos os termos
        WHERE (LOWER(c.status) = 'formalizado' OR LOWER(c.status) = 'formalized') 
        $dateFilter
        GROUP BY u.id, us.id, us.name, us.comission, s.name, u.name, u.role
        ORDER BY u.name ASC";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $relatorio = [];

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

    // Retorna array limpo
    $resultado = array_values($relatorio);
    echo json_encode($resultado);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erro SQL", "details" => $e->getMessage()]);
}
?>