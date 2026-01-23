<?php
// api/comissoes.php
require_once 'config.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // SQL que agrupa contratos formalizados por consultor e soma as comissões das usinas
        $sql = "SELECT 
                    u.id as userId,
                    u.name as consultor,
                    u.role,
                    COUNT(c.id) as contratos,
                    SUM(us.comission) as total_comissao
                FROM usuarios u
                LEFT JOIN clientes c ON u.id = c.userId AND c.status = 'Formalizado'
                LEFT JOIN usinas us ON c.usinaId = us.id
                WHERE u.role = 'consultant' OR u.role = 'supervisor'
                GROUP BY u.id
                ORDER BY total_comissao DESC";

        $stmt = $conn->query($sql);
        $dados = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($dados);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>