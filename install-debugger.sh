#!/bin/bash
curl -L -o /tmp/ckb-debugger.tar.gz https://github.com/nervosnetwork/ckb-standalone-debugger/releases/download/v1.0.0/ckb-debugger-linux-x64.tar.gz
tar -xzf /tmp/ckb-debugger.tar.gz -C /tmp/
sudo mv /tmp/ckb-debugger /usr/local/bin/ckb-debugger
ckb-debugger --version
