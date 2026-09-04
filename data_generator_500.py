import os
import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

def generate_financial_data():
    # Set seeds for reproducibility
    np.random.seed(42)
    random.seed(42)
    
    # Create output directory
    os.makedirs('data', exist_ok=True)
    
    # Distribution definitions (500 Total Base Transactions)
    distributions = {
        'exact': 325,
        'timing_difference': 60,
        'amount_mismatch': 40,
        'missing_settlement': 25,
        'missing_payment': 15,
        'duplicate': 15,
        'refund': 20
    }
    
    scenarios = []
    for k, v in distributions.items():
        scenarios.extend([k] * v)
        
    random.shuffle(scenarios)
    
    base_date = datetime(2026, 8, 1)
    
    invoices = []
    payments = []
    settlements = []
    bank_credits = []
    
    for i, scenario in enumerate(scenarios, start=1):
        inv_id = f"INV_{i:04d}"
        pay_id = f"PAY_{i:04d}"
        set_id = f"SET_{i:04d}"
        bnk_id = f"BNK_{i:04d}"
        
        # Base invoice info
        inv_date = base_date + timedelta(days=random.randint(0, 20))
        base_amt = round(random.uniform(5000, 100000), 2)
        gst_amt = round(base_amt * 0.18, 2)
        tot_amt = round(base_amt + gst_amt, 2)
        merch_id = f"MERCHANT_{random.randint(1, 10):03d}"
        pay_method = random.choice(['UPI', 'Card', 'NetBanking', 'Wallet'])
        
        # GT fields
        should_match = True
        exc_type = "none"
        conf = 1.0
        
        # Scenario adjustments
        if scenario == 'timing_difference':
            exc_type = 'timing_difference'
            conf = 0.90
        elif scenario == 'amount_mismatch':
            should_match = False
            exc_type = 'amount_mismatch'
            conf = 0.85
        elif scenario == 'missing_settlement':
            should_match = False
            exc_type = 'missing_settlement'
            conf = 0.0
        elif scenario == 'missing_payment':
            should_match = False
            exc_type = 'missing_payment'
            conf = 0.0
        elif scenario == 'duplicate':
            should_match = False
            exc_type = 'duplicate'
            conf = 0.0
        elif scenario == 'refund':
            base_amt = -base_amt
            gst_amt = -gst_amt
            tot_amt = -tot_amt
            exc_type = 'refund'
            conf = 0.95
            
        # 1. Invoice Record
        inv_record = {
            'Invoice_ID': inv_id,
            'Date': inv_date.strftime('%Y-%m-%d'),
            'Base_Amount': base_amt,
            'GST_Amount': gst_amt,
            'Total_Amount': tot_amt,
            'Merchant_ID': merch_id,
            'should_match': should_match,
            'exception_type': exc_type,
            'expected_match_confidence': conf
        }
        invoices.append(inv_record)
        
        if scenario == 'duplicate':
            # Add a duplicate invoice with the exact same details
            inv_record_dup = inv_record.copy()
            invoices.append(inv_record_dup)
            
        # 2. Payment Record
        if scenario != 'missing_payment':
            pay_date = inv_date
            pay_amt = tot_amt
            
            payments.append({
                'Payment_ID': pay_id,
                'Invoice_ID': inv_id,
                'Date': pay_date.strftime('%Y-%m-%d'),
                'Amount': pay_amt,
                'Payment_Method': pay_method
            })
            
        # 3. Settlement & Bank Records
        if scenario != 'missing_settlement':
            # Even if payment is missing, orphaned settlements use base info
            settle_date = inv_date + timedelta(days=1)
            mdr_amt = round(abs(tot_amt) * 0.02, 2)
            if tot_amt < 0:
                mdr_amt = -mdr_amt
                
            settle_amt = round(tot_amt - mdr_amt, 2)
            
            if scenario == 'timing_difference':
                settle_date += timedelta(days=random.randint(2, 6))
                
            if scenario == 'amount_mismatch':
                # Add random mismatch to settlement
                noise = round(random.uniform(-100, 100), 2)
                settle_amt += noise
                
            settlements.append({
                'Settlement_ID': set_id,
                'Payment_ID': pay_id,
                'Date': settle_date.strftime('%Y-%m-%d'),
                'Amount': settle_amt,
                'MDR_Amount': mdr_amt
            })
            
            bank_date = settle_date + timedelta(days=1)
            if scenario == 'timing_difference':
                bank_date += timedelta(days=random.randint(1, 3))
                
            bank_credits.append({
                'Bank_Txn_ID': bnk_id,
                'Settlement_ID': set_id,
                'Date': bank_date.strftime('%Y-%m-%d'),
                'Amount': settle_amt
            })

    # Convert to DataFrames
    df_inv = pd.DataFrame(invoices)
    df_pay = pd.DataFrame(payments)
    df_set = pd.DataFrame(settlements)
    df_bnk = pd.DataFrame(bank_credits)
    
    # Save to CSV
    df_inv.to_csv('data/invoices.csv', index=False)
    df_pay.to_csv('data/payments.csv', index=False)
    df_set.to_csv('data/settlements.csv', index=False)
    df_bnk.to_csv('data/bank_credits.csv', index=False)
    
    # Print statistics
    print(f"--- Financial Data Generation Complete ---")
    print(f"Generated Invoices: {len(df_inv)} records")
    print(f"Generated Payments: {len(df_pay)} records")
    print(f"Generated Settlements: {len(df_set)} records")
    print(f"Generated Bank Credits: {len(df_bnk)} records")
    print("\nException Distribution in Invoices:")
    print(df_inv['exception_type'].value_counts().to_string())
    
if __name__ == "__main__":
    generate_financial_data()
