# Git History Cleanup Guide

## Removing .env from Git History

This guide explains how to remove the `.env` file from the entire git history of this repository.

### ⚠️ Important Warnings

1. **This operation rewrites git history** - all commit SHAs will change
2. **All collaborators must re-clone** - existing clones will be incompatible
3. **Backup your repository** before proceeding
4. **This requires force push** - ensure you have the necessary permissions

### Prerequisites

- Git 2.22.0 or later
- Python 3.6 or later
- git-filter-repo installed (`pip install git-filter-repo`)

### Steps to Clean History

#### 1. Create a Fresh Clone

```bash
# Clone with full history (not shallow)
git clone <repository-url>
cd AI-Health-Backend
```

#### 2. Install git-filter-repo

```bash
pip install git-filter-repo
```

#### 3. Remove .env from All History

```bash
# Remove the .env file from all commits and branches
git filter-repo --path .env --invert-paths --force
```

This command:
- `--path .env` - targets the .env file
- `--invert-paths` - removes (instead of keeping) the specified paths
- `--force` - proceeds even if it's not a fresh clone

#### 4. Verify the File is Gone

```bash
# Check that .env doesn't exist in any commit
git log --all --full-history -- .env
# Should return nothing

# Check current status
git status
```

#### 5. Force Push to All Branches

```bash
# Push all branches with force
git push origin --force --all

# Push all tags with force
git push origin --force --tags
```

#### 6. Notify All Collaborators

Send this message to all team members:

> **URGENT: Repository History Rewrite**
>
> The git history has been cleaned to remove sensitive credentials. 
> 
> **You MUST delete your local clone and re-clone the repository:**
> 
> ```bash
> # Delete your old clone
> rm -rf AI-Health-Backend
> 
> # Clone fresh copy
> git clone <repository-url>
> cd AI-Health-Backend
> ```
>
> Do NOT attempt to push from an old clone - it will fail or cause issues.

### Alternative: Using BFG Repo-Cleaner

BFG is faster for large repositories:

```bash
# Download BFG
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# Create a clone
git clone --mirror <repository-url>
cd AI-Health-Backend.git

# Remove .env file
java -jar ../bfg-1.14.0.jar --delete-files .env

# Clean up and gc
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Push
git push --force
```

### Verification

After cleanup, verify:

```bash
# Should find nothing
git log --all --full-history -- .env

# Should find nothing
git rev-list --all --objects | grep .env
```

### After Cleanup

1. ✅ All secrets have been rotated (see [SECURITY.md](./SECURITY.md))
2. ✅ `.env.example` exists as template
3. ✅ `.env` is in `.gitignore`
4. ✅ Git history is clean
5. ✅ All collaborators have re-cloned

### Additional Security

Consider:

1. **GitHub Secret Scanning** - GitHub may have detected these secrets
2. **Audit Logs** - Check who accessed the repository
3. **Protected Branches** - Prevent force pushes to main/production branches in the future
4. **Pre-commit Hooks** - Install `git-secrets` or similar tools

### Need Help?

Contact the repository maintainers if you encounter issues during cleanup.

---

**Created:** December 7, 2025
