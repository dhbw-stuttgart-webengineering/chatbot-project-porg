$to = 'demirerkagan0808@gmail.com';
$subject = 'Report';
$message = 'Mail';
$headers = 'From: report@porg.de' . "\r\n" .

mail($to, $subject, $message, $headers);