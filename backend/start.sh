#!/bin/bash
echo "Starting MV Traders B2B Marketplace Backend..."
echo ""
echo "Installing dependencies..."
pip install -r requirements.txt
echo ""
echo "Starting FastAPI server..."
echo "Default login credentials:"
echo "Phone: 9999999999"
echo "Password: admin123"
echo ""
python main.py
