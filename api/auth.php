<?php
/* =====================================================
   FESTPRO API - Admin Auth & Dashboard
   URL: /festpro/api/auth.php
        /festpro/api/dashboard.php
   ===================================================== */
require_once '../includes/db.php';
setCORSHeaders();
session_start();

$endpoint = basename($_SERVER['PHP_SELF'], '.php');
$method   = $_SERVER['REQUEST_METHOD'];
$db       = getDB();

// ── Auth ─────────────────────────────────────────────
if ($endpoint === 'auth') {
    if ($method === 'POST') {
        $body = getBody();
        $username = trim($body['username'] ?? '');
        $password = $body['password'] ?? '';

        $stmt = $db->prepare("SELECT id, username, password FROM admins WHERE username = ? AND password = ?");
        $stmt->bind_param('ss', $username, $password);
        $stmt->execute();
        $admin = $stmt->get_result()->fetch_assoc();

        if (!$admin) {
            respond(['error' => 'Invalid credentials'], 401);
        }

        $_SESSION['admin'] = $admin['username'];
        $_SESSION['admin_id'] = $admin['id'];
        respond(['success' => true, 'username' => $admin['username']]);
    }

    if ($method === 'DELETE') {
        session_destroy();
        respond(['success' => true, 'message' => 'Logged out']);
    }

    if ($method === 'GET') {
        respond(['logged_in' => !empty($_SESSION['admin']), 'username' => $_SESSION['admin'] ?? null]);
    }
}

// ── Dashboard Stats ───────────────────────────────────
if ($endpoint === 'dashboard') {
    if (!isset($_SESSION['admin'])) respond(['error' => 'Unauthorized'], 401);

    $stats = [];

    // Total colleges
    $stats['total_colleges'] = $db->query("SELECT COUNT(*) as n FROM colleges")->fetch_assoc()['n'];

    // Total registrations
    $stats['total_registrations'] = $db->query("SELECT COUNT(*) as n FROM registrations")->fetch_assoc()['n'];

    // Approved
    $stats['approved'] = $db->query("SELECT COUNT(*) as n FROM registrations WHERE status='approved'")->fetch_assoc()['n'];

    // Pending
    $stats['pending'] = $db->query("SELECT COUNT(*) as n FROM registrations WHERE status='pending'")->fetch_assoc()['n'];

    // Total events
    $stats['total_events'] = $db->query("SELECT COUNT(*) as n FROM events WHERE is_active=1")->fetch_assoc()['n'];

    // Total PR awarded
    $stats['total_pr_awarded'] = $db->query("SELECT COALESCE(SUM(points),0) as n FROM pr_transactions")->fetch_assoc()['n'];

    // Dept breakdown
    $deptRows = $db->query("SELECT department, COUNT(*) as count FROM registrations GROUP BY department")->fetch_all(MYSQLI_ASSOC);
    $stats['dept_breakdown'] = $deptRows;

    // Top 5 leaderboard
    $stats['top_colleges'] = $db->query("SELECT cc_code, cl_name, total_pr FROM colleges ORDER BY total_pr DESC LIMIT 5")->fetch_all(MYSQLI_ASSOC);

    // Recent registrations
    $stats['recent_registrations'] = $db->query("SELECT reg_id, name, cc_code, event_name, status FROM registrations ORDER BY created_at DESC LIMIT 5")->fetch_all(MYSQLI_ASSOC);

    respond($stats);
}

// ── Export CSV ────────────────────────────────────────
if ($endpoint === 'export') {
    if (!isset($_SESSION['admin'])) respond(['error' => 'Unauthorized'], 401);
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="festpro_leaderboard_' . date('Ymd') . '.csv"');

    $rows = $db->query("SELECT cc_code, cl_name, department, total_pr FROM colleges ORDER BY total_pr DESC")->fetch_all(MYSQLI_ASSOC);
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Rank', 'CC Code', 'CL Name', 'Department', 'Total PR Points']);
    foreach ($rows as $i => $row) fputcsv($out, [$i + 1, $row['cc_code'], $row['cl_name'], $row['department'], $row['total_pr']]);
    fclose($out);
    exit;
}