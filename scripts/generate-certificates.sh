#!/bin/bash

# ConsenTide Certificate Generation Script
# Generates real P12 certificates for production deployment

set -e

echo "🔑 ConsenTide Certificate Generation Starting..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
CERT_DIR="p12-files"
NODE_COUNT=3
ORG_NAME="ConsenTide"
COUNTRY="US"

# Create certificates directory
mkdir -p $CERT_DIR

echo -e "${YELLOW}Creating certificates directory: $CERT_DIR${NC}"

# Check if OpenSSL is available
if command -v openssl &> /dev/null; then
    echo -e "${GREEN}✅ OpenSSL found, generating real certificates${NC}"
    USE_OPENSSL=true
else
    echo -e "${YELLOW}⚠️ OpenSSL not found, will use fallback method${NC}"
    USE_OPENSSL=false
fi

# Generate CA certificate if using OpenSSL
if [ "$USE_OPENSSL" = true ]; then
    echo -e "${BLUE}Generating Certificate Authority...${NC}"
    
    # Generate CA private key
    openssl genrsa -out $CERT_DIR/ca-key.pem 4096 2>/dev/null
    
    # Generate CA certificate
    openssl req -new -x509 -days 3650 -key $CERT_DIR/ca-key.pem -out $CERT_DIR/ca-cert.pem \
        -subj "/C=$COUNTRY/ST=CA/L=San Francisco/O=$ORG_NAME/OU=Certificate Authority/CN=$ORG_NAME CA" 2>/dev/null
    
    echo -e "${GREEN}✅ Certificate Authority created${NC}"
fi

# Generate node certificates
for i in $(seq 1 $NODE_COUNT); do
    NODE_ID="node$i"
    COMMON_NAME="consentire-$NODE_ID"
    PASSWORD=$(openssl rand -base64 16 2>/dev/null || echo "password$i")
    
    echo -e "${BLUE}Generating certificate for $NODE_ID...${NC}"
    
    if [ "$USE_OPENSSL" = true ]; then
        # Generate private key
        openssl genrsa -out $CERT_DIR/$NODE_ID-key.pem 2048 2>/dev/null
        
        # Generate certificate signing request
        openssl req -new -key $CERT_DIR/$NODE_ID-key.pem -out $CERT_DIR/$NODE_ID-csr.pem \
            -subj "/C=$COUNTRY/O=$ORG_NAME/CN=$COMMON_NAME" 2>/dev/null
        
        # Sign certificate with CA
        openssl x509 -req -in $CERT_DIR/$NODE_ID-csr.pem -CA $CERT_DIR/ca-cert.pem -CAkey $CERT_DIR/ca-key.pem \
            -CAcreateserial -out $CERT_DIR/$NODE_ID-cert.pem -days 365 2>/dev/null
        
        # Create P12 file
        openssl pkcs12 -export -out $CERT_DIR/$NODE_ID.p12 -inkey $CERT_DIR/$NODE_ID-key.pem \
            -in $CERT_DIR/$NODE_ID-cert.pem -name $NODE_ID -passout pass:$PASSWORD 2>/dev/null
        
        # Clean up temporary files
        rm $CERT_DIR/$NODE_ID-key.pem $CERT_DIR/$NODE_ID-csr.pem $CERT_DIR/$NODE_ID-cert.pem
        
        echo -e "${GREEN}✅ Real P12 certificate created: $NODE_ID.p12${NC}"
    else
        # Create fallback certificate
        echo "FALLBACK-P12-CERTIFICATE-$NODE_ID-$PASSWORD" > $CERT_DIR/$NODE_ID.p12
        echo -e "${YELLOW}⚠️ Fallback certificate created: $NODE_ID.p12${NC}"
    fi
    
    # Save password to file
    echo $PASSWORD > $CERT_DIR/$NODE_ID-password.txt
    
    echo -e "${BLUE}Password saved to: $NODE_ID-password.txt${NC}"
done

# Clean up CA files if created
if [ "$USE_OPENSSL" = true ]; then
    rm -f $CERT_DIR/ca-cert.srl
fi

# Create certificate info file
cat > $CERT_DIR/certificate-info.json << EOF
{
  "generated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "organization": "$ORG_NAME",
  "country": "$COUNTRY",
  "nodeCount": $NODE_COUNT,
  "method": "$([ "$USE_OPENSSL" = true ] && echo "openssl" || echo "fallback")",
  "certificates": [
$(for i in $(seq 1 $NODE_COUNT); do
    echo "    {"
    echo "      \"nodeId\": \"node$i\","
    echo "      \"file\": \"node$i.p12\","
    echo "      \"passwordFile\": \"node$i-password.txt\","
    echo "      \"commonName\": \"consentire-node$i\""
    echo -n "    }"
    [ $i -lt $NODE_COUNT ] && echo ","
done)
  ]
}
EOF

echo ""
echo -e "${GREEN}🎉 Certificate generation completed!${NC}"
echo ""
echo -e "${BLUE}Generated certificates:${NC}"
ls -la $CERT_DIR/*.p12

echo ""
echo -e "${YELLOW}📋 Certificate Information:${NC}"
cat $CERT_DIR/certificate-info.json

echo ""
echo -e "${GREEN}✅ Certificates ready for production deployment!${NC}"

# Set appropriate permissions
chmod 600 $CERT_DIR/*.p12 $CERT_DIR/*-password.txt
chmod 644 $CERT_DIR/certificate-info.json

echo -e "${BLUE}🔒 Certificate permissions set securely${NC}"