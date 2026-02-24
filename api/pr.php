<?php
/* =====================================================
   FESTPRO API - Leaderboard & PR Points
   URL: /festpro/api/leaderboard.php
        /festpro/api/pr.php
   ===================================================== */
require_once '../includes/db.php';
setCORSHeaders();

$endpoint = basename($_SERVER['PHP_SELF'], '.php');
$method   = $_SERVER['REQUEST_METHOD'];
$db       = getDB();

// ── Leaderboard ───────────────────────────────────────
if ($endpoint === 'leaderboard') {
    if ($method === 'GET') {
        $dept   = $_GET['dept']   ?? '';
        $search = $_GET['search'] ?? '';

        $sql = "SELECT cc_code, cl_name, department, total_pr FROM colleges WHERE 1=1";
        $params = []; $types = '';
        if ($dept)   { $sql .= " AND department = ?"; $params[] = $dept;         $types .= 's'; }
        if ($search) { $sql .= " AND (cc_code LIKE ? OR cl_name LIKE ?)";
                       $s = "%$search%"; $params[] = $s; $params[] = $s; $types .= 'ss'; }
        $sql .= " ORDER BY total_pr DESC";

        $stmt = $db->prepare($sql);
        if ($params) $stmt->bind_param($types, ...$params);
        $stmt->execute();
        respond($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    }
}

// ── PR Points ─────────────────────────────────────────
if ($endpoint === 'pr') {
    if ($method === 'POST') {
        session_start();
        if (empty($_SESSION['admin'])) respond(['error' => 'Unauthorized'], 401);

        $body     = getBody();
        $ccCode   = strtoupper(trim($body['cc_code'] ?? ''));
        $eventId  = intval($body['event_id'] ?? 0);
        $position = intval($body['position'] ?? 0);

        if (!$ccCode || !$eventId || !in_array($position, [0,1,2,3]))
            respond(['error' => 'Invalid parameters'], 422);

        // Get college
        $col = $db->prepare("SELECT id FROM colleges WHERE cc_code = ?");
        $col->bind_param('s', $ccCode);
        $col->execute();
        if (!$col->get_result()->num_rows) respond(['error' => 'CC Code not registered'], 404);

        // Get event points
        $ev = $db->prepare("SELECT pr_participation, pr_first, pr_second, pr_third FROM events WHERE id = ?");
        $ev->bind_param('i', $eventId);
        $ev->execute();
        $event = $ev->get_result()->fetch_assoc();
        if (!$event) respond(['error' => 'Event not found'], 404);

        $ptsMap = [0 => 'pr_participation', 1 => 'pr_first', 2 => 'pr_second', 3 => 'pr_third'];
        $points = $event[$ptsMap[$position]];

        // Prevent duplicate
        $dup = $db->prepare("SELECT id FROM pr_transactions WHERE cc_code=? AND event_id=? AND position=?");
        $dup->bind_param('sii', $ccCode, $eventId, $position);
        $dup->execute();
        if ($dup->get_result()->num_rows) respond(['error' => 'PR already awarded for this entry'], 409);

        // Insert transaction
        $ins = $db->prepare("INSERT INTO pr_transactions (cc_code, event_id, position, points) VALUES (?,?,?,?)");
        $ins->bind_param('siii', $ccCode, $eventId, $position, $points);
        $ins->execute();

        // Update college total
        $upd = $db->prepare("UPDATE colleges SET total_pr = total_pr + ? WHERE cc_code = ?");
        $upd->bind_param('is', $points, $ccCode);
        $upd->execute();

        // Get updated total
        $tot = $db->prepare("SELECT total_pr FROM colleges WHERE cc_code = ?");
        $tot->bind_param('s', $ccCode);
        $tot->execute();
        $updated = $tot->get_result()->fetch_assoc();

        respond([
            'success'   => true,
            'cc_code'   => $ccCode,
            'points_awarded' => $points,
            'total_pr'  => $updated['total_pr'],
            'position'  => $position,
            'message'   => "$points PR points awarded to $ccCode"
        ]);
    }

    // GET: PR transactions list
    if ($method === 'GET') {
        $ccCode = $_GET['cc_code'] ?? '';
        $sql = "SELECT t.*, e.name as event_name, e.department 
                FROM pr_transactions t JOIN events e ON t.event_id = e.id";
        if ($ccCode) { $sql .= " WHERE t.cc_code = ?"; }
        $sql .= " ORDER BY t.created_at DESC";
        $stmt = $db->prepare($sql);
        if ($ccCode) $stmt->bind_param('s', $ccCode);
        $stmt->execute();
        respond($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    }
}

// ── Events API ────────────────────────────────────────
if ($endpoint === 'events') {
    if ($method === 'GET') {
        $dept = $_GET['dept'] ?? '';
        $sql  = "SELECT * FROM events WHERE is_active = 1" . ($dept ? " AND department = ?" : "") . " ORDER BY department, name";
        $stmt = $db->prepare($sql);
        if ($dept) $stmt->bind_param('s', $dept);
        $stmt->execute();
        respond($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    }
    if ($method === 'POST') {
        session_start();
        if (empty($_SESSION['admin'])) respond(['error' => 'Unauthorized'], 401);
        $b = getBody();
        $stmt = $db->prepare("INSERT INTO events (event_code,name,department,description,rules,icon,pr_participation,pr_first,pr_second,pr_third) VALUES (?,?,?,?,?,?,?,?,?,?)");
        $stmt->bind_param('sssssssiiii', $b['event_code'],$b['name'],$b['department'],$b['description'],$b['rules'],$b['icon'],$b['pr_participation'],$b['pr_first'],$b['pr_second'],$b['pr_third']);
        $stmt->execute();
        respond(['success' => true, 'id' => $db->insert_id], 201);
    }
}