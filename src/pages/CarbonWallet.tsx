import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowUpRight, ArrowDownLeft, Coins, TrendingUp, Home, Send } from 'lucide-react';
import { gsap } from 'gsap';

const CarbonWallet = () => {
  const { user } = useAuth();
  const { credits, transactions, getUserProjects } = useData();
  const navigate = useNavigate();
  const [showTransfer, setShowTransfer] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    gsap.fromTo('.wallet-card', 
      { opacity: 0, y: 20, rotationX: -15 },
      { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1 }
    );

    // Coin flip animation for balance
    gsap.to('.balance-coin', {
      rotationY: 360,
      duration: 2,
      repeat: -1,
      ease: 'power2.inOut'
    });
  }, [user, navigate]);

  if (!user) return null;

  const userCredits = credits.filter(c => c.sellerId === user.id && c.status === 'available');
  const userTransactions = transactions.filter(t => t.buyerId === user.id || t.sellerId === user.id);
  const totalBalance = userCredits.reduce((sum, c) => sum + c.amount, 0);
  const userProjects = getUserProjects(user.id);
  const totalEarned = userProjects.reduce((sum, p) => sum + p.creditsGenerated, 0);

  return (
    <div className="min-h-screen bg-gradient-surface">
      <header className="glass px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <Home className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Carbon Credit Wallet</h1>
              <p className="text-muted-foreground">Manage your carbon credits</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-ocean-surface">
            <Wallet className="h-4 w-4 mr-2" />
            {totalBalance} Credits
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Wallet Balance */}
        <Card className="wallet-card glass-card p-8 mb-8">
          <div className="text-center">
            <div className="balance-coin w-20 h-20 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold gradient-text mb-2">{totalBalance.toLocaleString()}</h2>
            <p className="text-muted-foreground mb-6">Available Carbon Credits</p>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-sea-green">{totalEarned}</p>
                <p className="text-sm text-muted-foreground">Total Earned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-coral">{userTransactions.length}</p>
                <p className="text-sm text-muted-foreground">Transactions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-ocean-medium">{userProjects.length}</p>
                <p className="text-sm text-muted-foreground">Projects</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <Card className="wallet-card glass-card p-6">
            <h3 className="text-lg font-semibold mb-4 gradient-text">Recent Transactions</h3>
            <div className="space-y-3">
              {userTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-ocean-surface/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {transaction.sellerId === user.id ? (
                      <ArrowUpRight className="h-5 w-5 text-sea-green" />
                    ) : (
                      <ArrowDownLeft className="h-5 w-5 text-coral" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {transaction.sellerId === user.id ? 'Sold Credits' : 'Bought Credits'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{transaction.amount} credits</p>
                    <p className="text-xs text-muted-foreground">${transaction.totalPrice}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="wallet-card glass-card p-6">
            <h3 className="text-lg font-semibold mb-4 gradient-text">Quick Actions</h3>
            <div className="space-y-3">
              <Button variant="ocean" className="w-full" onClick={() => navigate('/marketplace')}>
                <Coins className="h-4 w-4 mr-2" />
                Buy Credits
              </Button>
              <Button variant="sea" className="w-full" onClick={() => setShowTransfer(!showTransfer)}>
                <Send className="h-4 w-4 mr-2" />
                Transfer Credits
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/marketplace')}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Sell Credits
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CarbonWallet;