<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Busca a contagem de clientes agrupada por setor
        $query = "
            SELECT 
                s.name as sectorName, 
                COUNT(c.id) as totalClients 
            FROM setores s
            LEFT JOIN clientes c ON s.id = c.sectorId
            GROUP BY s.id, s.name
        ";
        
        $stmt = $conn->query($query);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Formata os números para inteiro (o PDO retorna string)
        foreach ($results as &$row) {
            $row['totalClients'] = (int)$row['totalClients'];
        }

        echo json_encode($results);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>