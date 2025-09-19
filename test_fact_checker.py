#!/usr/bin/env python
"""Test the fact-checker directly"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fact_checker.agent import create_graph

async def test_fact_checker():
    print("Testing fact-checker with sample query...")

    # Create the graph
    graph = create_graph()

    # Test query
    test_text = "The Earth is flat and the moon is made of cheese"

    print(f"Query: {test_text}")
    print("Running fact-checker...")

    try:
        # Run the fact-checker
        result = await graph.ainvoke({"answer": test_text})

        print("\n=== RESULT ===")
        print(result)

        if result:
            print("\n=== FORMATTED OUTPUT ===")
            if isinstance(result, dict):
                for key, value in result.items():
                    print(f"{key}: {value}")
            else:
                print(str(result))

        return result
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = asyncio.run(test_fact_checker())
    print("\nTest complete!")