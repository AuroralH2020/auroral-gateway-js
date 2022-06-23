# HOW TO - Generate Private/Key pair to authenticate your gateway

# Generate your RSA private key
openssl genrsa -out gateway-key.pem 2048
# Convert your key to DER encoding (BINARY) so JAVA can work with it
openssl pkcs8 -topk8 -inform PEM -outform DER -in gateway-key.pem -out gateway-key.der -nocrypt
# Generate your public key in DER encoding for JAVA
openssl rsa -in gateway-key.pem -pubout -outform DER -out gateway-pubkey.der
# Encode your public key as PEM (ASCII) for uploading to the gateway
openssl rsa -in gateway-key.pem -pubout -outform PEM -out gateway-pubkey.pem
