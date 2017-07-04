# MMM-MyWink

This a module for <strong>MagicMirror</strong><br>
https://magicmirror.builders/<br>
https://github.com/MichMich/MagicMirror

This module displays current status of locks and garage doors connected to your Wink hub.

## Installation

1. Navigate to your MagicMirro `modules` directory and execute<br>
`git clone https://github.com/jclarke0000/MMM-MyWink.git`
2. Enter the new `MMM-MyWink` directory and execute `npm install`.

## Configuration

You'll need to request a clinet ID and client secret from the folks at Wink.  Do that here:
https://developer.wink.com/clients

It will take a few days to get your ID and secret via email.

<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>client_id</code></td>
      <td><strong>REQUIRED</strong> Client ID as provided by Wink<br><br><strong>Type</strong> <code>String</code></td>
    </tr>
    <tr>
      <td><code>client_secret</code></td>
      <td><strong>REQUIRED</strong> Client Secret as provided by Wink<br><br><strong>Type</strong> <code>String</code></td>
    </tr>
    <tr>
      <td><code>username</code></td>
      <td><strong>REQUIRED</strong> Your Wink username<br><br><strong>Type</strong> <code>String</code></td>
    </tr>
    <tr>
      <td><code>password</code></td>
      <td><strong>REQUIRED</strong> Your Wink password<br><br><strong>Type</strong> <code>String</code></td>
    </tr>
  </tbody>
</table>

