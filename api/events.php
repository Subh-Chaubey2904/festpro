<?php
require_once '../includes/db.php';
setCORSHeaders();

$db   = getDB();
$dept = $_GET['dept'] ?? '';

$sql  = "SELECT * FROM events WHERE is_active = 1" . ($dept ? " AND department = ?" : "") . " ORDER BY department, name";
$stmt = $db->prepare($sql);
if ($dept) $stmt->bind_param('s', $dept);
$stmt->execute();
respond($stmt->get_result()->fetch_all(MYSQLI_ASSOC));