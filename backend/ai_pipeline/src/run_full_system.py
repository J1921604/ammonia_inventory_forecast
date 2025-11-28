#!/usr/bin/env python3
"""
アンモニア在庫予測システム - 完全実行スクリプト
学習 → 予測 → ダッシュボード更新を一括実行
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command_list, description):
    """Run a command (list form) and stream its stdout/stderr to the current terminal in real time.

    Returns True on success (exit code 0), False otherwise.
    Use list-form args to avoid shell quoting issues on Windows.
    """
    print(f"\n=== {description} ===")
    try:
        # スクリプトファイルの存在確認を強化
        if len(command_list) >= 2 and command_list[1].endswith('.py'):
            script_path = os.path.join(os.getcwd(), command_list[1])
            if not os.path.exists(script_path):
                print(f"エラー: スクリプトが見つかりません: {script_path}")
                return False
            # ファイルサイズチェック（空ファイル検出）
            if os.path.getsize(script_path) == 0:
                print(f"エラー: スクリプトファイルが空です: {script_path}")
                return False

        # Ensure subprocess uses the same environment
        env = os.environ.copy()
        # 実行前にコマンドを確認表示
        print(f"実行コマンド: {' '.join(command_list)}")
        
        # Use line buffered output with enhanced error handling
        with subprocess.Popen(
            command_list, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.STDOUT, 
            bufsize=1, 
            text=True, 
            encoding='utf-8', 
            errors='replace', 
            env=env, 
            shell=False,
            universal_newlines=True
        ) as proc:
            try:
                for line in proc.stdout:
                    # print lines as they come with timestamp for debugging
                    print(f"[{description}] {line}", end='')
                    sys.stdout.flush()  # Ensure immediate output
                proc.wait()
                if proc.returncode == 0:
                    print(f"[完了] {description} 完了 (終了コード: {proc.returncode})")
                    return True
                else:
                    print(f"[エラー] {description} 失敗 (終了コード: {proc.returncode})")
                    return False
            except Exception as e:
                print(f"[エラー] {description} 実行中に例外発生: {e}")
                proc.kill()
                return False
    except KeyboardInterrupt:
        print(f"[中断] {description} がユーザーにより中断されました")
        return False
    except FileNotFoundError as e:
        print(f"[エラー] {description} ファイルが見つかりません: {e}")
        return False
    except PermissionError as e:
        print(f"[エラー] {description} 権限エラー: {e}")
        return False
    except Exception as e:
        print(f"[エラー] {description} 予期しないエラー: {e}")
        return False

def main():
    """メイン実行関数"""
    print("=== アンモニア在庫予測システム - 完全実行 ===")
    print("学習 → 予測 → ダッシュボード更新を順次実行します")
    
    # スクリプト位置からプロジェクトルートを決定し cwd を設定（cwd に依存させない）
    script_path = Path(__file__).resolve()
    project_dir = script_path.parent.parent
    
    print(f"プロジェクトディレクトリ: {project_dir}")
    
    try:
        os.chdir(project_dir)
        print(f"作業ディレクトリを {project_dir} に変更しました")
    except Exception as e:
        print(f"警告: 作業ディレクトリの変更に失敗しました: {e}. 処理を継続しますが、パス依存の処理で失敗する可能性があります。")

    # Use the same Python executable that's running this script to ensure consistency
    py_cmd = sys.executable
    print(f"使用するPythonインタープリター: {py_cmd}")

    # 実行前チェック: 必要なスクリプトファイルの存在確認
    required_scripts = [
        "src/prepare_data.py",
        "src/train.py",
        "src/predict.py", 
        "src/update_dashboard.py"
    ]
    
    missing_scripts = []
    for script in required_scripts:
        if not os.path.exists(script):
            missing_scripts.append(script)
    
    if missing_scripts:
        print(f"エラー: 必要なスクリプトが見つかりません: {missing_scripts}")
        return False

    # 開始時刻記録
    import time
    start_time = time.time()
    print(f"実行開始時刻: {time.strftime('%Y-%m-%d %H:%M:%S')}")

    # 0. データ準備（欠損補完）
    if not run_command([py_cmd, "src/prepare_data.py"], "データ準備（欠損補完）"):
        print("データ準備に失敗したため、処理を中止します")
        return False

    # 1. モデル学習（動的消費量率対応）
    if not run_command([py_cmd, "src/train.py"], "動的消費量率モデル学習"):
        print("学習に失敗したため、処理を中止します")
        return False
    
    # 2. 予測実行（動的消費量率対応）
    if not run_command([py_cmd, "src/predict.py"], "動的消費量率予測実行"):
        print("予測に失敗したため、処理を中止します")
        return False
    
    # 実行時間計算
    end_time = time.time()
    elapsed_time = end_time - start_time
    
    print("\n=== 実行完了 ===")
    print("✅ 動的消費量率による学習 → 予測 が完了しました")
    print(f"⏱️  実行時間: {elapsed_time:.2f}秒")
    print("📈 data/predictions.csv に予測結果が保存されています（37特徴量・動的消費量率対応）")
    print(f"🕐 完了時刻: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)