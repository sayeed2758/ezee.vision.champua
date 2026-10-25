// Zero-cost image upload endpoint: stores compressed photos in the GitHub repo,
// not Firebase Storage. Required Vercel environment variables are documented
// in README.txt. Never expose GITHUB_TOKEN in browser code.
const crypto = require('crypto');

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Use POST to upload an image.' });
  }

  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, FIREBASE_API_KEY } = process.env;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !FIREBASE_API_KEY || !adminEmail) {
    return json(res, 503, {
      error: 'Image upload is not configured yet. Add the GitHub and Firebase environment variables in Vercel, then redeploy.'
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return json(res, 400, { error: 'Invalid request JSON.' }); }
  }
  const idToken = body && typeof body.idToken === 'string' ? body.idToken : '';
  const dataUrl = body && typeof body.dataUrl === 'string' ? body.dataUrl : '';
  if (!idToken || !dataUrl) return json(res, 400, { error: 'A signed-in admin session and compressed image are required.' });

  // Only accept the JPEG output created by the admin's in-browser compressor.
  const match = dataUrl.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) return json(res, 400, { error: 'Image must be compressed to JPEG first. Please choose the image again.' });
  const image = Buffer.from(match[1], 'base64');
  const MAX_BYTES = 2_200_000; // keep base64 request safely below Vercel's 4.5 MB body limit
  if (!image.length || image.length > MAX_BYTES) {
    return json(res, 413, { error: 'This photo is too large after compression. Choose a smaller image and try again.' });
  }
  if (image.length < 3 || image[0] !== 0xff || image[1] !== 0xd8 || image[2] !== 0xff) {
    return json(res, 400, { error: 'The uploaded file is not a valid JPEG image.' });
  }

  // Verify the Firebase ID token against Firebase Auth and enforce the configured admin email.
  try {
    const verify = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
    const authData = await verify.json().catch(() => ({}));
    const user = Array.isArray(authData.users) ? authData.users[0] : null;
    if (!verify.ok || !user) return json(res, 401, { error: 'Your admin session expired. Sign in again, then retry the photo upload.' });
    if (!user.emailVerified || String(user.email || '').trim().toLowerCase() !== adminEmail) {
      return json(res, 403, { error: 'Only the verified configured admin account can upload photos.' });
    }
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return json(res, 502, { error: 'Could not verify the admin session. Check internet access and try again.' });
  }

  const filename = `${Date.now()}-${crypto.randomBytes(5).toString('hex')}.jpg`;
  const repoPath = `assets/uploads/${filename}`;
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(GITHUB_REPO)}/contents/${repoPath.split('/').map(encodeURIComponent).join('/')}`;
  try {
    const gh = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'Ezee-Vision-Champua-CMS'
      },
      body: JSON.stringify({
        message: `Add website image ${filename}`,
        content: image.toString('base64'),
        branch
      })
    });
    const result = await gh.json().catch(() => ({}));
    if (!gh.ok) {
      console.error('GitHub image upload failed:', gh.status, result.message || 'Unknown error');
      if (gh.status === 401 || gh.status === 403) {
        return json(res, 502, { error: 'GitHub rejected the upload. Check the fine-grained token and Contents: Read and write permission in Vercel.' });
      }
      if (gh.status === 404) {
        return json(res, 502, { error: 'GitHub repository or branch was not found. Check GITHUB_OWNER, GITHUB_REPO and GITHUB_BRANCH in Vercel.' });
      }
      return json(res, 502, { error: `GitHub could not save this photo (HTTP ${gh.status}). Try again or enter a public HTTPS image URL.` });
    }
    const url = result.content && result.content.download_url
      ? result.content.download_url
      : `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${branch}/${repoPath}`;
    return json(res, 200, { success: true, url, path: repoPath });
  } catch (error) {
    console.error('GitHub image upload request failed:', error);
    return json(res, 502, { error: 'Could not reach GitHub to store the photo. Check connection and try again.' });
  }
};
