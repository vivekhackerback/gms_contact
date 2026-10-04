<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
echo json_encode([
  'status' => 'success',
  'message' => 'PHP API endpoint is working perfectly!',
  'timestamp' => date('Y-m-d H:i:s')
]);
