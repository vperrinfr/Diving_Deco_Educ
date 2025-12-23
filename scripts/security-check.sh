#!/bin/bash

# Security Check Script for Decompression Calculator
# Run this before deployment to ensure security best practices

echo "🔒 Starting Security Check..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check 1: NPM Audit
echo ""
echo "📦 Checking NPM dependencies..."
if npm audit --audit-level=moderate > /dev/null 2>&1; then
    echo -e "${GREEN}✓ No moderate or high vulnerabilities found${NC}"
else
    echo -e "${RED}✗ Vulnerabilities detected! Run 'npm audit' for details${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: Environment files
echo ""
echo "🔐 Checking environment configuration..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
    
    # Check if .env contains default values
    if grep -q "your-secret-key-here" .env; then
        echo -e "${RED}✗ .env contains default values! Update with production secrets${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓ .env appears to be configured${NC}"
    fi
else
    echo -e "${YELLOW}⚠ .env file not found. Copy from .env.example${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 3: Sensitive files in git
echo ""
echo "🔍 Checking for sensitive files in git..."
if git ls-files | grep -q "\.env$\|diver\.env$"; then
    echo -e "${RED}✗ Sensitive files tracked by git!${NC}"
    echo "Run: git rm --cached .env diver.env"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ No sensitive files in git${NC}"
fi

# Check 4: Security dependencies
echo ""
echo "📚 Checking security dependencies..."
REQUIRED_DEPS=("helmet" "cors" "express-rate-limit" "express-validator")
MISSING_DEPS=()

for dep in "${REQUIRED_DEPS[@]}"; do
    if ! npm list "$dep" > /dev/null 2>&1; then
        MISSING_DEPS+=("$dep")
    fi
done

if [ ${#MISSING_DEPS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All security dependencies installed${NC}"
else
    echo -e "${RED}✗ Missing security dependencies: ${MISSING_DEPS[*]}${NC}"
    echo "Run: npm install ${MISSING_DEPS[*]}"
    ERRORS=$((ERRORS + 1))
fi

# Check 5: Build test
echo ""
echo "🏗️  Testing production build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Build successful${NC}"
    rm -rf dist
else
    echo -e "${RED}✗ Build failed! Check for errors${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 6: Security headers configuration
echo ""
echo "🛡️  Checking security configuration files..."
if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✓ vercel.json exists${NC}"
else
    echo -e "${YELLOW}⚠ vercel.json not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f "server/middleware/security.js" ]; then
    echo -e "${GREEN}✓ Security middleware exists${NC}"
else
    echo -e "${RED}✗ Security middleware missing!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 7: TypeScript errors
echo ""
echo "📝 Checking TypeScript..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ No TypeScript errors${NC}"
else
    echo -e "${YELLOW}⚠ TypeScript warnings detected${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "================================"
echo "📊 Security Check Summary"
echo "================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready for deployment${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    echo "Review warnings before deployment"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) and $WARNINGS warning(s) found${NC}"
    echo "Fix errors before deployment!"
    exit 1
fi

# Made with Bob
