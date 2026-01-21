<?php
require_once 'config.php';

// Limpa qualquer erro de texto que possa quebrar o JSON
ob_clean();

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["message" => "Dados incompletos"]);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT * FROM usuarios WHERE email = ? LIMIT 1");
    $stmt->execute([$data->email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // TESTE TEMPORÁRIO: Verifica se a senha bate (com hash ou texto puro)
        $passwordMatches = password_verify($data->password, $user['password']) || ($data->password === $user['password']);

        if ($passwordMatches) {
            unset($user['password']);
            echo json_encode(["success" => true, "user" => $user]);
            exit;
        }
    }
    
    // Se chegou aqui, as credenciais falharam
    http_response_code(401);
    echo json_encode(["message" => "Credenciais incorretas"]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erro no banco: " . $e->getMessage()]);
}