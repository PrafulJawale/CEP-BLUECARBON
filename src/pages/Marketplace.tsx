import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, ShoppingCart, Leaf } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { gsap } from 'gsap';

const Marketplace = () => {
  const { user } = useAuth();
  const { getAvailableCredits, purchaseCredits } = useData();

  useEffect(() => {
    // Page animations
    gsap.fromTo('.marketplace-card', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1 }
    );

    // Floating credit tokens
    gsap.to('.credit-token', {
      y: -10,
      duration: 2,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: -1,
      stagger: 0.3
    });
  }, []);

  const availableCredits = getAvailableCredits();

  const handlePurchase = (creditId: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to purchase credits.",
        variant: "destructive",
      });
      return;
    }

    const success = purchaseCredits(creditId, user.id);
    if (success) {
      toast({
        title: "Purchase successful!",
        description: "Carbon credits have been added to your portfolio.",
      });
    } else {
      toast({
        title: "Purchase failed",
        description: "Credits are no longer available.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="glass px-6 py-8">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">Carbon Credit Marketplace</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trade verified blue carbon credits from mangrove and coastal restoration projects
          </p>
          
          {/* Animated Credit Tokens */}
          <div className="relative mt-8 h-20 overflow-hidden">
            <div className="credit-token absolute top-0 left-1/4 w-12 h-12 bg-gradient-ocean rounded-full flex items-center justify-center">
              <Coins className="h-6 w-6 text-white" />
            </div>
            <div className="credit-token absolute top-2 right-1/3 w-10 h-10 bg-gradient-sea rounded-full flex items-center justify-center">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <div className="credit-token absolute top-4 left-1/2 w-14 h-14 bg-gradient-coral rounded-full flex items-center justify-center">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Market Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="marketplace-card glass-card text-center">
            <div className="p-6">
              <div className="text-3xl font-bold gradient-text mb-2">₹25</div>
              <div className="text-muted-foreground">Avg. Price/Credit</div>
            </div>
          </Card>

          <Card className="marketplace-card glass-card text-center">
            <div className="p-6">
              <div className="text-3xl font-bold gradient-sea-text mb-2">
                {availableCredits.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
              </div>
              <div className="text-muted-foreground">Available Credits</div>
            </div>
          </Card>

          <Card className="marketplace-card glass-card text-center">
            <div className="p-6">
              <div className="text-3xl font-bold gradient-text mb-2">152</div>
              <div className="text-muted-foreground">Transactions Today</div>
            </div>
          </Card>

          <Card className="marketplace-card glass-card text-center">
            <div className="p-6">
              <div className="text-3xl font-bold gradient-sea-text mb-2">+12%</div>
              <div className="text-muted-foreground">Price Change</div>
            </div>
          </Card>
        </div>

        {/* Available Credits */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold gradient-text">Available Credits</h2>
            <Badge variant="secondary" className="bg-gradient-ocean text-white">
              Live Market
            </Badge>
          </div>

          {availableCredits.length === 0 ? (
            <Card className="marketplace-card glass-card">
              <div className="p-12 text-center">
                <Coins className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Credits Available</h3>
                <p className="text-muted-foreground">
                  Check back later for new carbon credits from verified projects
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {availableCredits.map((credit) => (
                <Card key={credit.id} className="marketplace-card glass-card hover:scale-[1.02] transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary" className="bg-sea-green text-white">
                        Available
                      </Badge>
                      <div className="text-right">
                        <div className="text-2xl font-bold gradient-text">₹{credit.price}</div>
                        <div className="text-xs text-muted-foreground">per credit</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">
                        Blue Carbon Credits
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Verified credits from mangrove restoration project
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="text-sm text-muted-foreground">Amount</div>
                        <div className="text-xl font-semibold gradient-sea-text">
                          {credit.amount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Total Value</div>
                        <div className="text-xl font-semibold gradient-text">
                          ₹{(credit.amount * credit.price).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Leaf className="h-4 w-4 text-sea-green mr-2" />
                        <span>Verified CO₂ sequestration</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <TrendingUp className="h-4 w-4 text-ocean-deep mr-2" />
                        <span>Blockchain registered</span>
                      </div>
                    </div>

                    <Button 
                      variant="ocean" 
                      className="w-full mt-6"
                      onClick={() => handlePurchase(credit.id)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Purchase Credits
                    </Button>

                    {/* Seller Info */}
                    <div className="mt-4 p-3 bg-ocean-surface/10 rounded-lg">
                      <div className="text-xs text-muted-foreground">Seller ID:</div>
                      <div className="font-mono text-xs text-ocean-deep">
                        #{credit.sellerId}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Trading Info */}
        <Card className="marketplace-card glass-card mt-12">
          <div className="p-8">
            <h3 className="text-xl font-semibold gradient-text mb-4">How Carbon Credit Trading Works</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-ocean rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Leaf className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Verify Projects</h4>
                <p className="text-sm text-muted-foreground">
                  Projects are verified through AI monitoring and blockchain registration
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-sea rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Coins className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Mint Credits</h4>
                <p className="text-sm text-muted-foreground">
                  Verified CO₂ sequestration is converted to tradeable carbon credits
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-coral rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Trade Freely</h4>
                <p className="text-sm text-muted-foreground">
                  Buy and sell credits in our transparent marketplace platform
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Marketplace;