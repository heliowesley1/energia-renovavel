<?php
// 1. Headers de CORS - Devem ser os primeiros
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents("php://input"));

if ($method == 'POST') {
    if ($action == 'create') {
        // Incluindo comission no INSERT
        $sql = "INSERT INTO usinas (name, description, comission) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$data->name, $data->description, $data->comission]);
        echo json_encode(["success" => true]);

    } elseif ($action == 'update') {
        // Lógica de UPDATE (Ajuste para usar o ID que mandamos no payload)
        $sql = "UPDATE usinas SET name = ?, description = ?, comission = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $data->name, 
            $data->description, 
            $data->comission, 
            $data->id // O ID que o React agora envia no corpo
        ]);
        echo json_encode(["success" => true]);
    }
}

if ($method == 'DELETE') {
    $id = $_GET['id'];
    $sql = "DELETE FROM usinas WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$id]);
    echo json_encode(["success" => true]);
}
?>