<?php
/* Leaderboard endpoint - delegates to pr.php logic */
require_once '../includes/db.php';
setCORSHeaders();

$db     = getDB();
$dept   = $_GET['dept']   ?? '';
$search = $_GET['search'] ?? '';

$sql    = "SELECT cc_code, cl_name, department, total_pr FROM colleges WHERE 1=1";
$params = []; $types = '';

if ($dept)   { $sql .= " AND department = ?"; $params[] = $dept; $types .= 's'; }
if ($search) { 
    $sql .= " AND (cc_code LIKE ? OR cl_name LIKE ?)";
    $s = "%$search%"; $params[] = $s; $params[] = $s; $types .= 'ss';
}
$sql .= " ORDER BY total_pr DESC";

$stmt = $db->prepare($sql);
if ($params) $stmt->bind_param($types, ...$params);
$stmt->execute();
respond($stmt->get_result()->fetch_all(MYSQLI_ASSOC));