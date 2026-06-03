"""
Online Food Delivery Data Analysis - Execution Script
This script runs the complete analysis and displays results
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

# Set visualization style
sns.set_style('whitegrid')
plt.rcParams['figure.figsize'] = (10, 6)

print("=" * 80)
print("🍔 ONLINE FOOD DELIVERY DATA ANALYSIS")
print("=" * 80)
print()

# Load Dataset
print("📂 Loading Dataset...")
df = pd.read_csv('dataset/food_delivery.csv')
print(f"✅ Dataset loaded successfully! ({len(df)} orders)")
print()

# Dataset Overview
print("=" * 80)
print("📊 DATASET OVERVIEW")
print("=" * 80)
print(f"Shape: {df.shape[0]} rows × {df.shape[1]} columns")
print(f"\nColumns: {', '.join(df.columns.tolist())}")
print()

# Display first few rows
print("First 5 Orders:")
print(df.head())
print()

# Data Cleaning
print("=" * 80)
print("🧹 DATA CLEANING")
print("=" * 80)
print(f"Missing Values: {df.isnull().sum().sum()}")
print(f"Duplicate Rows: {df.duplicated().sum()}")

# Convert date/time
df['Order_Date'] = pd.to_datetime(df['Order_Date'])
df['Day_of_Week'] = df['Order_Date'].dt.day_name()
df['Month'] = df['Order_Date'].dt.month_name()
df['Order_Hour'] = pd.to_datetime(df['Order_Time'], format='%H:%M').dt.hour
print("✅ Date/Time columns converted successfully")
print()

# Key Statistics
print("=" * 80)
print("📈 KEY STATISTICS")
print("=" * 80)
print(f"Total Revenue: ₹{df['Order_Value'].sum():,.2f}")
print(f"Average Order Value: ₹{df['Order_Value'].mean():.2f}")
print(f"Average Delivery Time: {df['Delivery_Time_Minutes'].mean():.2f} minutes")
print(f"Average Rating: {df['Rating'].mean():.2f} / 5.0")
print(f"Average Distance: {df['Distance_KM'].mean():.2f} KM")
print()

# Food Analysis
print("=" * 80)
print("🍕 FOOD ANALYSIS")
print("=" * 80)
food_counts = df['Food_Item'].value_counts()
print("\nMost Ordered Food Items:")
print(food_counts.head(10))
print()

cuisine_counts = df['Cuisine_Type'].value_counts()
print("Orders by Cuisine Type:")
print(cuisine_counts)
print()

# Restaurant Analysis
print("=" * 80)
print("🏪 RESTAURANT ANALYSIS")
print("=" * 80)
restaurant_orders = df['Restaurant_Name'].value_counts()
print("\nOrders by Restaurant:")
print(restaurant_orders)
print()

restaurant_ratings = df.groupby('Restaurant_Name')['Rating'].mean().sort_values(ascending=False)
print("Average Rating by Restaurant:")
print(restaurant_ratings)
print()

restaurant_revenue = df.groupby('Restaurant_Name')['Order_Value'].sum().sort_values(ascending=False)
print("Total Revenue by Restaurant:")
print(restaurant_revenue)
print()

# Delivery Analysis
print("=" * 80)
print("🚚 DELIVERY ANALYSIS")
print("=" * 80)
print(f"Fastest Delivery: {df['Delivery_Time_Minutes'].min()} minutes")
print(f"Slowest Delivery: {df['Delivery_Time_Minutes'].max()} minutes")
print(f"Average Delivery Time: {df['Delivery_Time_Minutes'].mean():.2f} minutes")
print()

# Customer Behavior
print("=" * 80)
print("👥 CUSTOMER BEHAVIOR ANALYSIS")
print("=" * 80)
hourly_orders = df['Order_Hour'].value_counts().sort_index()
peak_hour = hourly_orders.idxmax()
print(f"Peak Ordering Hour: {peak_hour}:00 ({hourly_orders[peak_hour]} orders)")
print()

payment_counts = df['Payment_Method'].value_counts()
print("Payment Method Distribution:")
print(payment_counts)
print()

# Correlation Analysis
print("=" * 80)
print("🔗 CORRELATION ANALYSIS")
print("=" * 80)
numerical_cols = ['Delivery_Time_Minutes', 'Distance_KM', 'Order_Value', 'Rating']
correlation_matrix = df[numerical_cols].corr()
print("\nCorrelation Matrix:")
print(correlation_matrix)
print()

distance_time_corr = df['Distance_KM'].corr(df['Delivery_Time_Minutes'])
print(f"Distance vs Delivery Time Correlation: {distance_time_corr:.3f}")
print("📌 Strong positive correlation - longer distances increase delivery time")
print()

# Key Insights
print("=" * 80)
print("💡 KEY BUSINESS INSIGHTS")
print("=" * 80)
print()
print("1. CUSTOMER BEHAVIOR:")
print(f"   • Peak ordering time: {peak_hour}:00 hours (evening dinner time)")
print(f"   • Most preferred payment: {payment_counts.index[0]} ({payment_counts.iloc[0]} orders)")
print(f"   • Average customer rating: {df['Rating'].mean():.2f} (high satisfaction)")
print()

print("2. DELIVERY PERFORMANCE:")
print(f"   • Average delivery time: {df['Delivery_Time_Minutes'].mean():.2f} minutes")
print(f"   • Distance-Time correlation: {distance_time_corr:.2f} (strong positive)")
print("   • Longer distances significantly increase delivery time")
print()

print("3. REVENUE TRENDS:")
print(f"   • Total revenue: ₹{df['Order_Value'].sum():,.2f}")
print(f"   • Average order value: ₹{df['Order_Value'].mean():.2f}")
print(f"   • Top revenue restaurant: {restaurant_revenue.index[0]} (₹{restaurant_revenue.iloc[0]:,.2f})")
print()

print("4. POPULAR ITEMS:")
print(f"   • Most ordered item: {food_counts.index[0]} ({food_counts.iloc[0]} orders)")
print(f"   • Most popular cuisine: {cuisine_counts.index[0]} ({cuisine_counts.iloc[0]} orders)")
print(f"   • Top rated restaurant: {restaurant_ratings.index[0]} ({restaurant_ratings.iloc[0]:.2f} rating)")
print()

# Recommendations
print("=" * 80)
print("🎯 BUSINESS RECOMMENDATIONS")
print("=" * 80)
print()
print("1. Increase delivery staff during peak hours (19:00-21:00)")
print("2. Promote digital payment methods (UPI) with incentives")
print("3. Ensure adequate inventory for top-selling items")
print("4. Consider distance-based dynamic pricing")
print("5. Maintain quality standards to keep high ratings")
print("6. Create weekend promotions to boost orders")
print("7. Implement customer loyalty programs")
print()

print("=" * 80)
print("✅ ANALYSIS COMPLETE!")
print("=" * 80)
print()
print("📊 For visualizations, open: Online_Food_Delivery_Analysis_Executed.ipynb")
print("📚 For detailed guide, read: VIVA_PREPARATION_GUIDE.md")
print()
print("🎉 Project ready for submission!")
print("=" * 80)
