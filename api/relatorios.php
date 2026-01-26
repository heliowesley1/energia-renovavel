<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $role = $_GET['role'] ?? '';
        $sectors = $_GET['sectors'] ?? ''; // Recebe "1,2"

        // Base da query
        $sql = "SELECT s.name as sectorName, COUNT(c.id) as totalClients 
                FROM setores s
                LEFT JOIN clientes c ON s.id = c.sectorId";
        
        $where = [];
        $params = [];

        // Filtro de Segurança: Se for supervisor, limita a contagem apenas aos setores dele
        if ($role === 'supervisor' && !empty($sectors)) {
            $sectorArray = explode(',', $sectors);
            $placeholders = implode(',', array_fill(0, count($sectorArray), '?'));
            $where[] = "s.id IN ($placeholders)";
            $params = $sectorArray;
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }

        $sql .= " GROUP BY s.id, s.name ORDER BY totalClients DESC LIMIT 5";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
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