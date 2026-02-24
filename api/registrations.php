<?php
/* =====================================================
   FESTPRO API - Registrations
   URL: /festpro/api/registrations.php
   ===================================================== */
require_once '../includes/db.php';
setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

switch ($method) {

    // ── GET: List all registrations ──
    case 'GET':
        $status = $_GET['status'] ?? '';
        $ccCode = $_GET['cc_code'] ?? '';

        $sql = "SELECT r.*, e.name as event_name, e.department 
                FROM registrations r 
                JOIN events e ON r.event_id = e.id 
                WHERE 1=1";
        $params = []; $types = '';

        if ($status) { $sql .= " AND r.status = ?"; $params[] = $status; $types .= 's'; }
        if ($ccCode) { $sql .= " AND r.cc_code = ?"; $params[] = $ccCode; $types .= 's'; }
        $sql .= " ORDER BY r.created_at DESC";

        $stmt = $db->prepare($sql);
        if ($params) $stmt->bind_param($types, ...$params);
        $stmt->execute();
        respond($stmt->get_result()->fetch_all(MYSQLI_ASSOC));

    // ── POST: New registration ──
    case 'POST':
        $body = getBody();
        $required = ['name','cc_code','cl_name','contact','event_id'];
        foreach ($required as $field) {
            if (empty($body[$field])) respond(['error' => "Missing: $field"], 422);
        }

        // Generate reg ID
        $regId = 'REG' . strtoupper(substr(md5(uniqid()), 0, 8));

        // Get event info
        $ev = $db->prepare("SELECT id, name, department FROM events WHERE id = ? AND is_active = 1");
        $ev->bind_param('i', $body['event_id']);
        $ev->execute();
        $event = $ev->get_result()->fetch_assoc();
        if (!$event) respond(['error' => 'Event not found or inactive'], 404);

        // Upsert college in leaderboard
        $db->prepare("INSERT IGNORE INTO colleges (cc_code, cl_name, department) VALUES (?,?,?)")
           ->bind_param('sss', $body['cc_code'], $body['cl_name'], $event['department']);
        $db->execute_query("INSERT IGNORE INTO colleges (cc_code, cl_name, department) VALUES (?,?,?)",
            [$body['cc_code'], $body['cl_name'], $event['department']]);

        $stmt = $db->prepare("
            INSERT INTO registrations 
                (reg_id, name, cc_code, cl_name, contact, email, team_members, event_id, event_name, department) 
            VALUES (?,?,?,?,?,?,?,?,?,?)
        ");
        $email = $body['email'] ?? '';
        $team  = $body['team_members'] ?? '';
        $stmt->bind_param('sssssssiss',
            $regId, $body['name'], $body['cc_code'], $body['cl_name'],
            $body['contact'], $email, $team,
            $body['event_id'], $event['name'], $event['department']
        );
        $stmt->execute();
        respond(['success' => true, 'reg_id' => $regId, 'message' => 'Registration submitted. Awaiting approval.'], 201);

    // ── PUT: Update status ──
    case 'PUT':
        $body = getBody();
        $id     = intval($body['id'] ?? 0);
        $status = $body['status'] ?? '';
        if (!$id || !in_array($status, ['approved','rejected'])) respond(['error' => 'Invalid request'], 422);

        // On approve: add participation PR
        if ($status === 'approved') {
            // Get registration + event points
            $reg = $db->query("SELECT r.cc_code, r.event_id, r.pr_added, e.pr_participation 
                               FROM registrations r JOIN events e ON r.event_id = e.id 
                               WHERE r.id = $id")->fetch_assoc();

            if ($reg && !$reg['pr_added']) {
                addPRPoints($db, $reg['cc_code'], $reg['event_id'], 0, $reg['pr_participation']);
                $db->query("UPDATE registrations SET pr_added = 1 WHERE id = $id");
            }
        }

        $stmt = $db->prepare("UPDATE registrations SET status = ? WHERE id = ?");
        $stmt->bind_param('si', $status, $id);
        $stmt->execute();
        respond(['success' => true]);

    default:
        respond(['error' => 'Method not allowed'], 405);
}

function addPRPoints($db, $ccCode, $eventId, $position, $points) {
    // Prevent duplicates
    $check = $db->prepare("SELECT id FROM pr_transactions WHERE cc_code=? AND event_id=? AND position=?");
    $check->bind_param('sii', $ccCode, $eventId, $position);
    $check->execute();
    if ($check->get_result()->num_rows > 0) return false;

    $ins = $db->prepare("INSERT INTO pr_transactions (cc_code, event_id, position, points) VALUES (?,?,?,?)");
    $ins->bind_param('siii', $ccCode, $eventId, $position, $points);
    $ins->execute();

    $upd = $db->prepare("UPDATE colleges SET total_pr = total_pr + ? WHERE cc_code = ?");
    $upd->bind_param('is', $points, $ccCode);
    $upd->execute();
    return true;
}