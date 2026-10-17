package com.anubhav.commonutility;

import android.os.Handler;
import android.view.MotionEvent;
import android.view.View;
import android.widget.Button;

/**
 * Created by Manoj Verma on 26/3/2022.
 */
public class CounterHandler {
    final Handler handler = new Handler();
    private int viewId;
    private View incrementalView;
    private View decrementalView;
    private long minRange = -50;
    private long maxRange = 50;
    private long startNumber = 0;
    private long counterStep = 1;
    private int counterDelay = 50; //millis

    private boolean isCycle = false;
    private boolean autoIncrement = false;
    private boolean autoDecrement = false;

    public static void launchCounterHandler(CounterListener counterListener, int id, Button buttonPlus, Button buttonMinus,
                                            long minRange, long maxRange, long startNumber) {
        new Builder()
                .setViewId(id) // counter view root id
                .incrementalView(buttonPlus)
                .decrementalView(buttonMinus)
                .minRange(minRange) // cant go any less than -50
                .maxRange(maxRange) // cant go any further than 50
                .startNumber(startNumber) // start counter from position
                .isCycle(true) // 49,50,-50,-49 and so on
                .counterDelay(50) // speed of counter
                .counterStep(1)  // steps e.g. 0,2,4,6...
                .listener(counterListener) // to listen counter results and show them in app
                .build();
    }

    private CounterListener listener;

    private Runnable counterRunnable = new Runnable() {
        @Override
        public void run() {
            if (autoIncrement) {
                increment();
                handler.postDelayed(this, counterDelay);
            } else if (autoDecrement) {
                decrement();
                handler.postDelayed(this, counterDelay);
            }
        }
    };

    private CounterHandler(Builder builder) {
        viewId = builder.viewId;
        incrementalView = builder.incrementalView;
        decrementalView = builder.decrementalView;
        minRange = builder.minRange;
        maxRange = builder.maxRange;
        startNumber = builder.startNumber;
        counterStep = builder.counterStep;
        counterDelay = builder.counterDelay;
        isCycle = builder.isCycle;
        listener = builder.listener;

        initDecrementalView();
        initIncrementalView();

        if (listener != null) {
            listener.onIncrement(viewId, incrementalView, startNumber);
            listener.onDecrement(viewId, decrementalView, startNumber);
        }
    }

    private void initIncrementalView() {
        incrementalView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                increment();
            }
        });

        incrementalView.setOnLongClickListener(new View.OnLongClickListener() {
            @Override
            public boolean onLongClick(View v) {
                autoIncrement = true;
                handler.postDelayed(counterRunnable, counterDelay);
                return false;
            }
        });
        incrementalView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                if (event.getAction() == MotionEvent.ACTION_UP && autoIncrement) {
                    autoIncrement = false;
                } else if (event.getAction() == MotionEvent.ACTION_MOVE && autoIncrement) {
                    autoIncrement = false;
                }
                return false;
            }
        });

    }

    private void initDecrementalView() {
        decrementalView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                decrement();
            }
        });

        decrementalView.setOnLongClickListener(new View.OnLongClickListener() {
            @Override
            public boolean onLongClick(View v) {
                autoDecrement = true;
                handler.postDelayed(counterRunnable, counterDelay);
                return false;
            }
        });
        decrementalView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                if (event.getAction() == MotionEvent.ACTION_UP && autoDecrement) {
                    autoDecrement = false;
                } else if (event.getAction() == MotionEvent.ACTION_MOVE && autoDecrement) {
                    autoDecrement = false;
                }
                return false;
            }
        });

    }

    private void increment() {
        long number = startNumber;

        if (maxRange != -1) {
            if (number + counterStep <= maxRange) {
                number += counterStep;
            } else if (isCycle) {
                number = minRange == -1 ? 0 : minRange;
            }
        } else {
            number += counterStep;
        }

        if (number != startNumber && listener != null) {
            startNumber = number;
            listener.onIncrement(viewId, incrementalView, startNumber);
        }

    }

    private void decrement() {
        long number = startNumber;

        if (minRange != -1) {
            if (number - counterStep >= minRange) {
                number -= counterStep;
            } else if (isCycle) {
                number = maxRange == -1 ? 0 : maxRange;

            }
        } else {
            number -= counterStep;
        }

        if (number != startNumber && listener != null) {
            startNumber = number;
            listener.onDecrement(viewId, decrementalView, startNumber);
        }
    }

    public interface CounterListener {
        void onIncrement(int viewId, View view, long number);

        void onDecrement(int viewId, View view, long number);
    }

    public static final class Builder {
        private int viewId = 0;   // id for multiple use in same callback
        private View incrementalView;
        private View decrementalView;
        private long minRange = -1;  // cant go any less than -1
        private long maxRange = 10;  // cant go any further than 10
        private long startNumber = 0; // start counter from 0
        private long counterStep = 1;  // steps e.g. 0,2,4,6...
        private int counterDelay = 50; // speed of counter
        private boolean isCycle; // 49,50,-50,-49 and so on
        private CounterListener listener; // to listen counter results and show them in app

        public Builder() {
        }

        public Builder setViewId(int val) {
            viewId = val;
            return this;
        }

        public Builder incrementalView(View val) {
            incrementalView = val;
            return this;
        }

        public Builder decrementalView(View val) {
            decrementalView = val;
            return this;
        }

        public Builder minRange(long val) {
            minRange = val;
            return this;
        }

        public Builder maxRange(long val) {
            maxRange = val;
            return this;
        }

        public Builder startNumber(long val) {
            startNumber = val;
            return this;
        }

        public Builder counterStep(long val) {
            counterStep = val;
            return this;
        }

        public Builder counterDelay(int val) {
            counterDelay = val;
            return this;
        }

        public Builder isCycle(boolean val) {
            isCycle = val;
            return this;
        }

        public Builder listener(CounterListener val) {
            listener = val;
            return this;
        }

        public com.anubhav.commonutility.CounterHandler build() {
            return new com.anubhav.commonutility.CounterHandler(this);
        }
    }
}