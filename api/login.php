<?php
require_once 'config.php';

// Recebe os dados do frontend
$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["message" => "Dados incompletos"]);
    exit;
}

try {
    // Busca o usuário pelo e-mail
    $stmt = $conn->prepare("SELECT * FROM usuarios WHERE email = ? AND active = 1 LIMIT 1");
    $stmt->execute([$data->email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Valida a senha usando o hash do banco
    if ($user && password_verify($data->password, $user['password'])) {
        // Remove a senha por segurança antes de enviar ao React
        unset($user['password']);
        
        echo json_encode([
            "success" => true,
            "user" => $user
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["message" => "E-mail ou senha inválidos"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erro no banco: " . $e->getMessage()]);
}
?>