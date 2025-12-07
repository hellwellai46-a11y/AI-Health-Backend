# Security Notice

## ⚠️ Critical Security Incident - Exposed Secrets

### Issue
A `.env` file containing active secrets was accidentally committed to the repository git history in commit `7bab73e79036d1e7fe553ff6196c2c87ed88cb5a` on November 1, 2025. This file contained:

- Google Gemini API Key
- MongoDB connection string with embedded credentials
- SMTP credentials (Gmail app password)

While the file was removed from the repository in a subsequent commit (`04aa1dc17d8c555f27e76f3ab2584e7539a54e87`), it remains in the git history and can be accessed by anyone who clones the repository.

### Required Actions

**IMMEDIATELY:**

1. ✅ **Rotate/Revoke All Exposed Credentials**
   - ❗ Revoke the Google Gemini API key: `AIzaSyB6An8OkwyDTZ5jOFUg-1_aOeMEiFl-uX4`
   - ❗ Change MongoDB password for user: `devanshbansal25072004`
   - ❗ Revoke Gmail app password: `mcedwwii xxkm ukrl`
   - ❗ Generate new credentials and update them in your local `.env` file

2. ✅ **Audit Access**
   - Review MongoDB access logs for any unauthorized access
   - Check Google Cloud Console for API usage
   - Review Gmail activity for suspicious sends

3. ✅ **Clean Git History**
   - Remove `.env` file from all git history using BFG Repo-Cleaner or git-filter-repo
   - Force push to all branches
   - Notify all collaborators to re-clone the repository

### Prevention

To prevent this from happening again:

1. **Never commit sensitive files**
   - Always use `.env` files for secrets (already added to `.gitignore`)
   - Use `.env.example` as a template (provided)
   - Double-check `git status` before committing

2. **Use pre-commit hooks**
   - Consider using tools like `git-secrets` or `detect-secrets`
   - Scan for potential secrets before commits

3. **Use secret management**
   - For production, use proper secret management (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Use environment variables in CI/CD platforms

### Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual credentials in `.env` (never commit this file)

3. Verify `.env` is in `.gitignore`:
   ```bash
   git check-ignore .env
   # Should output: .env
   ```

### Reporting Security Issues

If you discover a security vulnerability, please email the maintainers directly instead of opening a public issue.

---

**Last Updated:** December 7, 2025
