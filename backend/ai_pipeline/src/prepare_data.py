"""
データ準備スクリプト
学習・予測の前に実行し、データの欠損を埋める
"""
import os
import sys
import pandas as pd

# パス設定
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.preprocess import load_data, fill_missing_actuals

def main():
    print("=== データ準備開始 ===")
    
    # パス設定
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    data_path = os.path.join(project_root, 'data', 'training_data.csv')
    
    if not os.path.exists(data_path):
        print(f"Error: Data file not found at {data_path}")
        sys.exit(1)
        
    # データ読み込み
    print(f"Reading data from {data_path}")
    df = load_data(data_path)
    original_len = len(df)
    
    # 欠損埋め
    df = fill_missing_actuals(df)
    
    if len(df) > original_len:
        print(f"Added {len(df) - original_len} rows (filled from previous years).")
        # 保存
        # 日付フォーマットを維持
        df.to_csv(data_path, index=False)
        print(f"Updated data saved to {data_path}")
    else:
        print("No missing data to fill.")
        
    print("=== データ準備完了 ===")

if __name__ == '__main__':
    main()
